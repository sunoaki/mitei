import { v4 as uuidv4 } from 'uuid';

import type { Syncer } from '../syncer/types';

import IRR from './IRR/manager/manager';
import { IRR as IRRTypes } from './IRR/types';

export class Mitei {
    public syncerList: { [uuid: string]: Syncer } = {};
    public nameIndex: { [name: string]: string } = {}; // name to UUID

    public ownedByMitei: string[] = []; // list of IRR UUID owned by Mitei

    public IRRManager: IRR = new IRR();

    constructor() {}

    registerSyncer(name: string, syncer: Syncer): string {
        if (this.nameIndex[name]) {
            throw new Error('A syncer with the same name already exists');
        }

        const uuid = uuidv4();
        this.syncerList[uuid] = syncer;
        this.nameIndex[name] = uuid;

        return uuid;
    }

    async syncASSets(uuid: string): Promise<void> {
        const syncer = this.syncerList[uuid];
        const asSetsList = syncer.listASSets();

        const baseSelector = this.IRRManager.selector
            .reset()
            .selectByType(IRRTypes.Type.AS_SET)
            .selectBySource(syncer.source);

        for (const asSet of await asSetsList) {
            const selector = baseSelector.clone().selectByName(asSet.name);

            if (this.ownedByMitei.includes(selector.uuids[0])) {
                // If the AS-SET is already owned by Mitei, just upload local version.
                const localASSet = selector.results[0];
                await syncer.modifyASSet(localASSet);

                continue;
            }

            if (selector.uuids.length > 0) {
                // If the AS-SET exists but not owned by Mitei, query the syncer for the AS-SET and compare with local version.
                const remoteASSet = await syncer.queryASSet(asSet.name);
                const localASSet = selector.results[0];

                if (!localASSet.content.isEqual(remoteASSet.content)) {
                    // means different, we need check last modified time to decide which one is newer.
                    if (
                        localASSet.last_modified.getTime() >
                        remoteASSet.last_modified.getTime()
                    ) {
                        // local version is newer, upload to syncer.
                        await syncer.modifyASSet(localASSet);
                    } else {
                        // remote version is newer, do patch on local.
                        const patch = localASSet.content.diff(
                            remoteASSet.content,
                        );

                        if (
                            patch.added.length > 0 ||
                            patch.removed.length > 0
                        ) {
                            const patchedASSetContent =
                                localASSet.content.patch(patch);

                            localASSet.content = patchedASSetContent;

                            this.IRRManager.replace(
                                selector.uuids[0],
                                localASSet,
                            );
                        }
                    }
                }

                continue;
            }

            // If the AS-SET does not exist, query the syncer for the AS-SET and register to irrManager.

            const remoteASSet = await syncer.queryASSet(asSet.name);

            this.IRRManager.register(remoteASSet);
        }
    }
}

export default Mitei;
