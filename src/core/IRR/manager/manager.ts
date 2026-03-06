import { INVALID_RPSL_NAME, isRPSLName } from "../base/tools";
import { IRR as IRRTypes } from "../types";
import { v4 as uuidv4 } from "uuid";

import IRRSelector from "./selector";

export const errorList = {
	/** Error when the IRR Object is invalid */
	INVALID_IRR_OBJECT: new Error("Invalid IRR Object"),
	/** Error when an object with the same name already exists */
	REPLICATED_OBJECT_NAME: new Error(
		"An object with the same name already exists",
	),
};

export default class IRR<T extends IRRTypes.Object = IRRTypes.Object> {
	/** use UUID as a key, Object as value */
	public registrations: { [key: string]: T } = {};
	public nameIndex: { [key: string]: string[] } = {}; // name to UUID
	public sourceIndex: { [key in IRRTypes.Source]?: string[] } = {}; // source to UUIDs
	public typeIndex: { [key in IRRTypes.Type]?: string[] } = {}; // type to UUIDs

	private getUUID(): string {
		return uuidv4();
	}

	private isValidIRRObject(object: T): boolean {
		if (!isRPSLName(object.name)) {
			throw INVALID_RPSL_NAME;
		}

		if (this.nameIndex[object.name]) {
			throw errorList.REPLICATED_OBJECT_NAME;
		}

		return true;
	}

	private buildIndex(uuid: string): void {
		const object = this.registrations[uuid];

		// name index
		if (!this.nameIndex[object.name]) {
			this.nameIndex[object.name] = [];
		}
		this.nameIndex[object.name]!.push(uuid);

		// source index
		if (!this.sourceIndex[object.source]) {
			this.sourceIndex[object.source] = [];
		}
		this.sourceIndex[object.source]!.push(uuid);

		// type index
		if (!this.typeIndex[object.type]) {
			this.typeIndex[object.type] = [];
		}
		this.typeIndex[object.type]!.push(uuid);
	}

	public rebuildIndex(): void {
		this.nameIndex = {};
		this.sourceIndex = {};
		this.typeIndex = {};

		for (const uuid in this.registrations) {
			this.buildIndex(uuid);
		}
	}

	public register(object: T): string {
		if (!this.isValidIRRObject(object)) {
			throw errorList.INVALID_IRR_OBJECT;
		}

		const uuid = this.getUUID();

		this.registrations[uuid] = object;

		this.buildIndex(uuid);

		return uuid;
	}

	public delete(uuid: string): void {
		const object = this.registrations[uuid];
		if (!object) {
			return;
		}

		// do not update indexes here, rebuildIndex should be called after batch deletions
		delete this.registrations[uuid];
	}

	public replace(uuid: string, newObject: T): void {
		if (!this.isValidIRRObject(newObject)) {
			throw errorList.INVALID_IRR_OBJECT;
		}

		this.registrations[uuid] = newObject;
		this.buildIndex(uuid);
	}

	get selector(): IRRSelector<T> {
		return new IRRSelector<T>(this);
	}
}
