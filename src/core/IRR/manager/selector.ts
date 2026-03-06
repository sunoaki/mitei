import { IRR as IRRTypes } from "../types";
import IRRManager from "./manager";

export default class IRRSelector<T extends IRRTypes.Object = IRRTypes.Object> {
	private IRR: IRRManager<T>;
	private resultList: { [key: string]: T } = {};

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

	clone(): IRRSelector<T> {
		const newIRRSelector: IRRSelector<T> = new IRRSelector(this.IRR);
		newIRRSelector.resultList = { ...this.resultList };
		return newIRRSelector;
	}

	reset(): IRRSelector<T> {
		this.resultList = { ...this.IRR.registrations };
		return this;
	}

	private clean(): void {
		this.resultList = {};
	}

	selectByName(name: string): IRRSelector<T> {
		const uuids = this.IRR.nameIndex[name];

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

	selectBySource(source: IRRTypes.Source): IRRSelector<T> {
		const uuids = this.IRR.sourceIndex[source];

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

	selectByType(type: IRRTypes.Type): IRRSelector<IRRTypes.TypeMap[IRRTypes.Type]> {
		const uuids = this.IRR.typeIndex[type];

		if (!uuids) {
			this.clean();
			return this as unknown as IRRSelector<IRRTypes.TypeMap[IRRTypes.Type]>;
		}

		for (const uuid in this.resultList) {
			if (!uuids.includes(uuid)) {
				delete this.resultList[uuid];
			}
		}

		return this as unknown as IRRSelector<IRRTypes.TypeMap[IRRTypes.Type]>;
	}

	selectByUUIDs(uuids: string[]): IRRSelector<T> {
		const uuidSet = new Set(uuids);

		for (const uuid in this.resultList) {
			if (!uuidSet.has(uuid)) {
				delete this.resultList[uuid];
			}
		}
		return this;
	}
}
