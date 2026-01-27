import { IRR as IRRTypes } from "../types";
import IRRManager from "./manager";

export default class IRRSelector {
	private IRR: IRRManager;
	private resultList: { [key: string]: IRRTypes.Object } = {};

	constructor(IRRManager: IRRManager) {
		this.IRR = IRRManager;
		this.reset();
	}

	get results(): IRRTypes.Object[] {
		return Object.values(this.resultList);
	}

	reset(): IRRSelector {
		this.resultList = { ...this.IRR.registrations };
		return this;
	}

	private clean(): void {
		this.resultList = {};
	}

	selectByName(name: string): IRRSelector {
		const uuid = this.IRR.nameIndex[name];

		if (uuid) {
			if (this.resultList[uuid]) {
				this.resultList = {
					[uuid]: this.resultList[uuid],
				};
			} else {
				this.clean();
			}
		} else {
			this.clean();
		}

		return this;
	}

	selectBySource(source: IRRTypes.Source): IRRSelector {
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

	selectByType(type: IRRTypes.Type): IRRSelector {
		const uuids = this.IRR.typeIndex[type];

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

	selectByUUIDs(uuids: string[]): IRRSelector {
		const uuidSet = new Set(uuids);

		for (const uuid in this.resultList) {
			if (!uuidSet.has(uuid)) {
				delete this.resultList[uuid];
			}
		}
		return this;
	}
}
