import { IRR as IRRTypes } from '../types';
import IRRManager from './manager';

export default class IRRSelector<T extends IRRTypes.Object = IRRTypes.Object> {
    private IRR: IRRManager<T>;
    private resultList: { [key: string]: T } = {};
    private count: number = 0;

    constructor(IRRManager: IRRManager<T>) {
        this.IRR = IRRManager;
        this.reset();
    }

    get results(): T[] {
        return Object.values(this.resultList);
    }

    get uuids(): string[] {
        return Object.keys(this.resultList);
    }

    get resultsMap(): { [key: string]: T } {
        return this.resultList;
    }

    get queryTimes(): number {
        return this.count;
    }

    clone(): IRRSelector<T> {
        const newIRRSelector: IRRSelector<T> = new IRRSelector(this.IRR);
        newIRRSelector.resultList = { ...this.resultList };
        return newIRRSelector;
    }

    reset(): IRRSelector<T> {
        this.resultList = { ...this.IRR.registrations };
        this.count = 0;
        return this;
    }

    private clean(): void {
        this.resultList = {};
    }

    selectByName(name: string | string[]): IRRSelector<T> {
        this.count++;

        const uuids = Array.isArray(name)
            ? name.flatMap((n) => this.IRR.nameIndex[n])
            : this.IRR.nameIndex[name];

        if (!uuids) {
            this.clean();
            return this;
        }

        for (const uuid in this.resultList) {
            if (!uuids.includes(uuid)) {
                delete this.resultList[uuid];
            }
        }

        return this;
    }

    selectBySource(
        source: IRRTypes.Source | IRRTypes.Source[],
    ): IRRSelector<T> {
        this.count++;

        const uuids = Array.isArray(source)
            ? source.flatMap((s) => this.IRR.sourceIndex[s])
            : this.IRR.sourceIndex[source];

        if (!uuids) {
            this.clean();
            return this;
        }

        for (const uuid in this.resultList) {
            if (!uuids.includes(uuid)) {
                delete this.resultList[uuid];
            }
        }

        return this;
    }

    selectByType(
        type: IRRTypes.Type | IRRTypes.Type[],
    ): IRRSelector<IRRTypes.TypeMap[IRRTypes.Type]> {
        this.count++;

        const uuids = Array.isArray(type)
            ? type.flatMap((t) => this.IRR.typeIndex[t])
            : this.IRR.typeIndex[type];

        if (!uuids) {
            this.clean();
            return this as unknown as IRRSelector<
                IRRTypes.TypeMap[IRRTypes.Type]
            >;
        }

        for (const uuid in this.resultList) {
            if (!uuids.includes(uuid)) {
                delete this.resultList[uuid];
            }
        }

        return this as unknown as IRRSelector<IRRTypes.TypeMap[IRRTypes.Type]>;
    }

    selectByUUIDs(uuids: string[]): IRRSelector<T> {
        this.count++;

        const uuidSet = new Set(uuids);

        if (!uuidSet) {
            this.clean();
            return this;
        }

        for (const uuid in this.resultList) {
            if (!uuidSet.has(uuid)) {
                delete this.resultList[uuid];
            }
        }

        return this;
    }
}
