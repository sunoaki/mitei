import type { as_set } from 'src/core/IRR/AS_SET/types';
import { ASSetContent, ASSetObject } from 'src/core/IRR/AS_SET';

import { easy_as_set } from './types';
import { v4 as uuidv4 } from 'uuid';

import type { IRR } from 'src/core/IRR/types';

export class EasyASSetObject extends ASSetObject implements easy_as_set.Object {
    private readonly uuid = uuidv4;

    constructor(
        name: string,
        source: IRR.Source,
        content?: ASSetContent,
        mnt_by?: IRR.mnter.reference[],
    ) {
        super(name, source, content ?? new ASSetContent(), mnt_by);
    }

    patchList: as_set.Patch[] = [];

    easyContents: {
        [contentUUID: string]: {
            content: easy_as_set.Content;
            contentName: string;
            lastRefreshed: Date | null;
            lastApplied: Date | null;
            lastContent: as_set.Content | null;
        };
    } = {};

    /** Return the UUID of the eayirr content */
    register(content: easy_as_set.Content): string {
        const contentUUID = this.uuid();

        this.easyContents[contentUUID] = {
            content: content,
            contentName: content.contentName,
            lastRefreshed: null,
            lastApplied: null,
            lastContent: null,
        };

        return contentUUID;
    }

    /** Delete the easy irr content by its UUID */
    unregister(contentUUID: string): void {
        delete this.easyContents[contentUUID];
    }

    clean() {
        this.easyContents = {};
        this.patchList = [];
        this.content = new ASSetContent();
    }

    /** Refresh the content by generate a patch from newer context to older, need  */
    async makePatch(contentUUID: string): Promise<as_set.Patch> {
        const registered = this.easyContents[contentUUID];
        if (!registered) {
            throw new Error(`Content UUID ${contentUUID} not registered.`);
        }

        const newContent = await registered.content.toASSetContent();
        registered.lastRefreshed = new Date();

        const patch = this.content.diff(newContent as ASSetContent);
        this.patchList.push(patch);

        registered.lastContent = newContent;

        return patch;
    }

    applyPatches(): void {
        for (const patch of this.patchList) {
            this.content = this.content.patch(patch);
        }

        this.last_modified = new Date();

        this.patchList = [];
    }

    async refreshAll(): Promise<void> {
        await Promise.all(
            Object.keys(this.easyContents).map(async (contentUUID) => {
                await this.makePatch(contentUUID);
            }),
        );

        this.applyPatches();
    }
}
