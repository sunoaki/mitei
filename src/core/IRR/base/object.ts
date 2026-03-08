import { IRR } from '../types';

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
        this.name = name.toLowerCase(); // RPSL requires lowercase object names
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
                    rpsl += mnt.remarks
                        .map((remark) => `remarks: ${remark}\n`)
                        .join('');
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
                        .join('');
            }
        }

        if (this.created)
            rpsl += `created: ${this.created.toISOString().replace(/\.\d{3}Z$/, 'Z')}\n`;
        if (this.last_modified)
            rpsl += `last-modified: ${this.last_modified.toISOString().replace(/\.\d{3}Z$/, 'Z')}\n`;

        rpsl += this.content.toRPSL();

        return rpsl;
    }

    public toString = this.toRPSL;

    protected static parseBaseFields(rpsl: string): {
        name: string;
        type: IRR.Type;
        source: IRR.Source;
        mnt_by: IRR.mnter.reference[];
        contact: IRR.contact.reference[];
        created?: Date;
        last_modified?: Date;
    } {
        const parsed: {
            name: string;
            type: IRR.Type;
            source: IRR.Source;
            mnt_by: IRR.mnter.reference[];
            contact: IRR.contact.reference[];
            created?: Date;
            last_modified?: Date;
        } = {
            name: '',
            type: IRR.Type.AS_SET,
            source: IRR.Source.undetermined,
            mnt_by: [],
            contact: [],
        };

        const pendingSourceByName = new Map<string, IRR.Source>();
        let lastReference:
            | IRR.mnter.reference
            | IRR.contact.reference
            | undefined;

        const applyPendingSource = (
            ref: IRR.mnter.reference | IRR.contact.reference,
        ): void => {
            const pendingSource = pendingSourceByName.get(ref.name);
            if (pendingSource) {
                ref.source = pendingSource;
                pendingSourceByName.delete(ref.name);
            }
        };

        const parseSourcedRemark = (
            text: string,
        ): { name: string; source: IRR.Source } | undefined => {
            const match = text.match(/^(.+?)\s+sourced\s+from\s+(.+)$/i);
            if (!match) return undefined;

            return {
                name: match[1].trim(),
                source: match[2].trim() as IRR.Source,
            };
        };

        for (const line of rpsl.split('\n')) {
            const [key, ...rest] = line.split(':');
            if (!key || rest.length === 0) continue;

            const value = rest.join(':').trim();
            if (!value) continue;

            const normalizedKey = key.trim().toLowerCase();

            switch (normalizedKey) {
                case 'as-set':
                    parsed.name = value;
                    parsed.type = IRR.Type.AS_SET;
                    lastReference = undefined;
                    break;
                case 'source':
                    parsed.source = value as IRR.Source;
                    lastReference = undefined;
                    break;
                case 'mnt-by': {
                    const mntRef: IRR.mnter.reference = { name: value };
                    applyPendingSource(mntRef);
                    parsed.mnt_by.push(mntRef);
                    lastReference = mntRef;
                    break;
                }
                case 'created':
                    parsed.created = new Date(value);
                    lastReference = undefined;
                    break;
                case 'last-modified':
                    parsed.last_modified = new Date(value);
                    lastReference = undefined;
                    break;
                case 'admin-c':
                case 'tech-c':
                case 'zone-c':
                case 'abuse-c':
                case 'routing-c': {
                    const contactRef: IRR.contact.reference = {
                        type: normalizedKey,
                        name: value,
                    };
                    applyPendingSource(contactRef);
                    parsed.contact.push(contactRef);
                    lastReference = contactRef;
                    break;
                }
                case 'remarks': {
                    const sourced = parseSourcedRemark(value);

                    if (sourced) {
                        if (lastReference && lastReference.name === sourced.name) {
                            lastReference.source = sourced.source;
                        } else {
                            pendingSourceByName.set(sourced.name, sourced.source);
                        }
                        break;
                    }

                    if (!lastReference) {
                        break;
                    }

                    if (!lastReference.remarks) {
                        lastReference.remarks = [];
                    }
                    lastReference.remarks.push(value);
                    break;
                }
                default:
                    // Once we enter content/object-specific fields, stop
                    // attaching following remarks to base references.
                    lastReference = undefined;
                    break;
            }
        }

        return parsed;
    }
}
