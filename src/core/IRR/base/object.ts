import { IRR } from "../types";

export class IRRObject implements IRR.Object {
	public readonly name: string;
	public readonly type: IRR.Type;
	public readonly source: IRR.Source;
	public readonly mnt_by: IRR.mnter.reference[] = [];
	public readonly contact: IRR.contact.reference[] = [];
	public readonly created: Date = new Date();
	public last_modified: Date = new Date();

	public content: IRR.Content;

	constructor(
		name: string,
		type: IRR.Type,
		source: IRR.Source,
		content: IRR.Content,
		mnt_by?: IRR.mnter.reference[],
		contact?: IRR.contact.reference[],
		created?: Date,
		last_modified?: Date,
	) {
		this.name = name;
		this.type = type;
		this.source = source;
		this.content = content;
		if (mnt_by) this.mnt_by = mnt_by;
		if (contact) this.contact = contact;
		if (created) this.created = created;
		if (last_modified) this.last_modified = last_modified;
	}

	public toRPSL(): string {
		let rpsl = `${this.type}: ${this.name}\n`;
		rpsl += `source: ${this.source}\n`;

		if (this.mnt_by) {
			for (const mnt of this.mnt_by) {
				if (mnt.source)
					rpsl += `remarks: ${mnt.name} sourced from ${mnt.source}\n`;
				rpsl += `mnt-by: ${mnt.name}\n`;
				if (mnt.remarks)
					rpsl += mnt.remarks.map((remark) => `remarks: ${remark}\n`).join("");
			}
		}

		if (this.contact) {
			for (const contact of this.contact) {
				if (contact.source)
					rpsl += `remarks: ${contact.name} sourced from ${contact.source}\n`;
				rpsl += `${contact.type}: ${contact.name}\n`;
				if (contact.remarks)
					rpsl += contact.remarks
						.map((remark) => `remarks: ${remark}\n`)
						.join("");
			}
		}

		if (this.created)
			rpsl += `created: ${this.created.toISOString().replace(/\.\d{3}Z$/, "Z")}\n`;
		if (this.last_modified)
			rpsl += `last-modified: ${this.last_modified.toISOString().replace(/\.\d{3}Z$/, "Z")}\n`;

		rpsl += this.content.toRPSL();

		return rpsl;
	}

	public toString = this.toRPSL;
}
