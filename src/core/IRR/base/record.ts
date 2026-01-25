import { IRR } from "..";

export class IRRRecord implements IRR.Record {
	public readonly name: string;
	public readonly type: IRR.Type;
	public readonly source: IRR.Source;
	public readonly mnt_by: IRR.mnter.reference[] = [];

	public content: IRR.Content;

	constructor(
		name: string,
		type: IRR.Type,
		source: IRR.Source,
		content: IRR.Content,
		mnt_by?: IRR.mnter.reference[],
	) {
		this.name = name;
		this.type = type;
		this.source = source;
		this.content = content;
		if (mnt_by) this.mnt_by = mnt_by;
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

		rpsl += this.content.toRPSL();

		return rpsl;
	}
}
