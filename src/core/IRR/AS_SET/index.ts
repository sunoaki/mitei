import { IRR } from '../types';
import { as_set } from './types';
import IRRContent from '../base/content';
import { IRRObject } from '../base/object';
import { inSource } from '../base/tools';
import { isValidASSetMemberName, isValidASSETName } from './validator';
import { isRPSLName, INVALID_RPSL_NAME } from '../base/tools';

/** Error messages related to AS_SET members */
export const errorList = {
    /** Error thrown when an invalid RPSL name is provided. */
    INVALID_RPSL_NAME,
    /** Error thrown when an invalid source is provided for an AS_SET member, We now support Source list in `IRR.Source` */
    MEMBER_SOURCE_INVALID: new Error(
        'Invalid source provided for AS_SET member.',
    ),
    /** Error thrown when an invalid name is provided for an AS_SET member. */
    MEMBER_NAME_INVALID: new Error('Invalid name provided for AS_SET member.'),
    /** Error thrown when an invalid name is provided for an AS_SET. */
    AS_SET_NAME_INVALID: new Error('Invalid AS_SET name provided.'),
    /** Error thrown when an invalid source is provided for an AS_SET. */
    AS_SET_SOURCE_INVALID: new Error('Invalid source provided for AS_SET.'),
};

export class ASSetMember implements as_set.Member {
    public name: string;
    public source?: IRR.Source;
    public remarks?: string[];

    constructor(name: string, source?: IRR.Source, remarks?: string[]) {
        if (!inSource(source) && source !== undefined) {
            throw errorList.MEMBER_SOURCE_INVALID;
        }

        if (!isRPSLName(name)) {
            throw errorList.INVALID_RPSL_NAME + ` Invalid name: ${name}`;
        }

        if (!isValidASSetMemberName(name)) {
            throw errorList.MEMBER_NAME_INVALID + ` Invalid name: ${name}`;
        }

        this.name = name;
        this.source = source;
        this.remarks = remarks;
    }
}

export class ASSetContent extends IRRContent implements as_set.Content {
    // we simulate members as a set using an array.
    public members: ASSetMember[];

    constructor(members?: ASSetMember[]) {
        super();
        this.members = [];

        for (const member of members || []) {
            this.add(member);
        }
    }

    /** Returns the index of a member in the members array, or -1 if not found. */
    index(member: ASSetMember): number {
        let index = this.members.findIndex(
            (m) => m.name === member.name && m.source === member.source,
        );

        if (index !== -1) return index;

        index = this.members.findIndex(
            (m) => m.name === member.name && (!m.source || !member.source),
        );

        return index;
    }

    private makeMemberFromNumber(asn: number): ASSetMember {
        return new ASSetMember(`AS${asn}`);
    }

    /** Returns true if the member exists in the members array. */
    has(member: ASSetMember | number): boolean {
        if (typeof member === 'number') {
            member = this.makeMemberFromNumber(member);
        }

        return this.index(member) !== -1;
    }

    /** Adds a member to the members array. */
    add(member: ASSetMember | number): void {
        if (typeof member === 'number') {
            member = this.makeMemberFromNumber(member);
        }

        const index = this.index(member);

        if (index === -1) {
            this.members.push(member);
        } else {
            this.members[index] = member;
        }
    }

    /** Removes a member from the members array. True means the member was removed, false means it was not found. */
    delete(member: ASSetMember | number): boolean {
        if (typeof member === 'number') {
            member = this.makeMemberFromNumber(member);
        }

        const index = this.index(member);

        if (index !== -1) {
            this.members.splice(index, 1);
            return true;
        }

        return false;
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

    /** Returns a patch between this and another ASSetContent. */
    diff(other: ASSetContent): as_set.Patch {
        const added: ASSetMember[] = [];
        const removed: ASSetMember[] = [];

        for (const member of other.members) {
            if (!this.has(member)) {
                added.push(member);
            }
        }
        for (const member of this.members) {
            if (!other.has(member)) {
                removed.push(member);
            }
        }

        return { added, removed };
    }

    /** Return a new ASSetContent with the patch applied */
    patch(Patch: as_set.Patch): ASSetContent {
        const result = new ASSetContent(this.members);

        for (const member of Patch.added) {
            result.add(member);
        }
        for (const member of Patch.removed) {
            result.delete(member);
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
                rpsl += member.remarks
                    .map((remark) => `remarks: ${remark}\n`)
                    .join('');
            }
        }

        return rpsl;
    }
}

export class ASSetObject extends IRRObject implements as_set.Object {
    public readonly type = IRR.Type.AS_SET;
    declare public content: ASSetContent;

    constructor(
        name: string,
        source: IRR.Source,
        content: ASSetContent,
        mnt_by?: IRR.mnter.reference[],
        contact?: IRR.contact.reference[],
        created?: Date,
        last_modified?: Date,
    ) {
        super(
            name,
            IRR.Type.AS_SET,
            source,
            content,
            mnt_by,
            contact,
            created,
            last_modified,
        );

        if (!isRPSLName(name)) {
            throw errorList.INVALID_RPSL_NAME + ` Received: ${name}`;
        }

        if (!isValidASSETName(name)) {
            throw errorList.AS_SET_NAME_INVALID + ` Received: ${name}`;
        }

        if (!inSource(source)) {
            throw errorList.MEMBER_SOURCE_INVALID + ` Received: ${source}`;
        }
    }
}
