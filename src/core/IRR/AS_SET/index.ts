import { IRR } from "..";
import IRRContent from "../base/content";
import { IRRRecord } from "../base/record";
import { inSource } from "../base/tools";
import { isValidASNName, isValidASSETName } from "./validator";
import { isRPSLName, INVALID_RPSL_NAME } from "../base/tools";

/** Error messages related to AS_SET members */
export const errorList = {
	/** Error thrown when an invalid RPSL name is provided. */
	INVALID_RPSL_NAME,
	/** Error thrown when an invalid source is provided for an AS_SET member, We now support Source list in `IRR.Source` */
	MEMBER_SOURCE_INVALID: new Error("Invalid source provided for AS_SET member."),
	/** Error thrown when an invalid name is provided for an AS_SET member. */
	MEMBER_NAME_INVALID: new Error("Invalid name provided for AS_SET member."),
	/** Error thrown when an invalid name is provided for an AS_SET. */
	AS_SET_NAME_INVALID: new Error("Invalid AS_SET name provided."),
	/** Error thrown when an invalid source is provided for an AS_SET. */
	AS_SET_SOURCE_INVALID: new Error("Invalid source provided for AS_SET."),
};

export class ASSetMember implements IRR.recordReference {
	public name: string;
	public source: IRR.Source;
	public remarks?: string[];

	constructor(name: string, source: IRR.Source, remarks?: string[]) {
		if (!inSource(source)) {
			throw errorList.MEMBER_SOURCE_INVALID;
		}

		if (!isRPSLName(name)) {
			throw errorList.INVALID_RPSL_NAME;
		}

		if (!isValidASNName(name) && !isValidASSETName(name)) {
			throw errorList.MEMBER_NAME_INVALID;
		}

		this.name = name;
		this.source = source;
		this.remarks = remarks;
	}
}

export class ASSetContent extends IRRContent implements IRR.Content {
	// we simulate members as a set using an array.
	public members: ASSetMember[];

	constructor() {
		super();
		this.members = [];
	}

	/** Returns the index of a member in the members array, or -1 if not found. */
	private index(member: ASSetMember): number {
		return this.members.findIndex(
			(m) => m.name === member.name && m.source === member.source,
		);
	}

	/** Returns true if the member exists in the members array. */
	has(member: ASSetMember): boolean {
		return this.index(member) !== -1;
	}

	/** Adds a member to the members array. */
	add(member: ASSetMember) {
		const index = this.index(member);
		if (index === -1) {
			this.members.push(member);
		} else {
			this.members[index] = member;
		}
	}

	/** Removes a member from the members array. */
	delete(member: ASSetMember) {
		const index = this.index(member);
		if (index !== -1) {
			this.members.splice(index, 1);
		}
	}

	/** Checks if this ASSetContent is equal to another. */
	isEqual(other: ASSetContent): boolean {
		if (this.members.length !== other.members.length) {
			return false;
		}

		for (const member of this.members) {
			if (!other.has(member)) {
				return false;
			}
		}

		return true;
	}

	/** Returns a new ASSetContent with members in this but not in other. */
	difference(other: ASSetContent): ASSetContent {
		const result = new ASSetContent();

		for (const member of this.members) {
			if (!other.has(member)) {
				result.add(member);
			}
		}

		return result;
	}

	/** Returns a new ASSetContent with members in either this or other. */
	union(other: ASSetContent): ASSetContent {
		const result = new ASSetContent();

		for (const member of this.members) {
			result.add(member);
		}
		for (const member of other.members) {
			result.add(member);
		}

		return result;
	}

	toRPSL(): string {
		let rpsl = super.toRPSL();

		for (const member of this.members) {
			if (member.source) {
				rpsl += `remarks: ${member.name} sourced from ${member.source}\n`;
			}
			rpsl += `members: ${member.name}\n`;
			if (member.remarks) {
				rpsl += member.remarks.map((remark) => `remarks: ${remark}\n`).join("");
			}
		}

		return rpsl;
	}
}

export class ASSetRecord extends IRRRecord implements IRR.Record {
	public readonly type = "AS_SET" as IRR.Type.AS_SET;

	constructor(name: string, source: IRR.Source, content: ASSetContent, mnt_by?: IRR.mnter.reference[]) {
		super(name, "AS_SET" as IRR.Type.AS_SET, source, content, mnt_by);

		if (!isRPSLName(name)) {
			throw errorList.INVALID_RPSL_NAME;
		}

		if (!isValidASSETName(name)) {
			throw errorList.AS_SET_NAME_INVALID;
		}

		if (!inSource(source)) {
			throw errorList.MEMBER_SOURCE_INVALID;
		}
	}
}
