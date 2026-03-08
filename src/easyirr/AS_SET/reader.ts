import { parse } from 'yaml';
import { ASN_Member } from './member/asn';
import { AS_SET_Member } from './member/as_set';
import { Content } from './member/content';
import easy_as_set from './types';

export function generateMemberByName(member: any): easy_as_set.Member {
    switch (typeof member) {
        case 'number':
            return new ASN_Member(member);
        case 'string':
            if (member.startsWith('AS')) {
                // may be AS_NUMBER or AS_SET, but we can only determine it after parsing the content.
                const asn = parseInt(member.slice(2));
                if (!isNaN(asn)) {
                    return new ASN_Member(asn);
                }
            }

            if (member.includes('AS-')) {
                // may be AS_SET.
                let name = member,
                    source;
                if (member.includes('::')) {
                    [source, name] = member.split('::');
                }
                return new AS_SET_Member({
                    setName: name,
                    sources: source ? [source] : undefined,
                    flatten: false,
                });
            }
            throw new Error(`Invalid member string: ${member}`);
        default:
            throw new Error(`Unsupported member type: ${typeof member}`);
    }
}

export function parseMember(
    member: easy_as_set.contentConf.contextMember,
): easy_as_set.Member {
    if (['number', 'string'].includes(typeof member)) {
        return generateMemberByName(member);
    } else if (typeof member !== 'object' || member === null) {
        throw new Error(`Invalid member format: ${JSON.stringify(member)}`);
    }

    const finishMemberWithDetails = (
        baseMember: easy_as_set.Member,
        memberValue:
            | easy_as_set.contentConf.ASNMemberOptions
            | easy_as_set.contentConf.asSetMemberOptions,
    ) => {
        const normalizeRemarks = (remarks?: string | string[]) => {
            if (typeof remarks === 'string') return [remarks];
            return remarks;
        };

        if (baseMember instanceof ASN_Member) {
            if ('remarks' in memberValue)
                baseMember.remarks = normalizeRemarks(memberValue?.remarks);
            return baseMember;
        }

        if (baseMember instanceof AS_SET_Member) {
            const baseOptions: easy_as_set.contentConf.asSetMemberOptions =
                memberValue as any;

            if ('flatten' in baseOptions)
                baseMember.flatten = baseOptions.flatten;
            if ('depth' in baseOptions) baseMember.depth = baseOptions.depth;
            if ('sources' in baseOptions)
                baseMember.sources =
                    typeof baseOptions.sources === 'string'
                        ? [baseOptions.sources]
                        : baseOptions.sources;
            if ('irrdGraphQLEndpoint' in baseOptions)
                baseMember.irrdGraphQLEndpoint =
                    baseOptions.irrdGraphQLEndpoint;
            if ('exclude' in baseOptions)
                baseMember.exclude = baseOptions.exclude?.map(parseMember);
            if ('remarks' in baseOptions)
                baseMember.remarks = normalizeRemarks(baseOptions.remarks);
            return baseMember;
        }

        throw new Error(
            `Unsupported member type: ${baseMember.constructor.name}`,
        );
    };

    if (Object.keys(member).length === 1) {
        const key = Object.keys(member)[0] as keyof typeof member;
        const memberValue:
            | easy_as_set.contentConf.ASNMemberOptions
            | easy_as_set.contentConf.asSetMemberOptions =
            (member[key] as any) ?? {};
        const baseMember = generateMemberByName(String(key));
        return finishMemberWithDetails(baseMember, memberValue);
    }

    if ('type' in member && 'value' in member) {
        const { type, value, ...memberValue } = member as any;
        let baseMember: easy_as_set.Member;

        switch (type) {
            case 'ASN':
                if (typeof value === 'number') {
                    baseMember = new ASN_Member(value);
                } else if (
                    typeof value === 'string' &&
                    value.startsWith('AS')
                ) {
                    const asn = parseInt(value.slice(2));
                    if (isNaN(asn))
                        throw new Error(`Invalid AS_NUMBER value: ${value}`);
                    baseMember = new ASN_Member(asn);
                } else {
                    throw new Error(`Invalid AS_NUMBER value: ${value}`);
                }
                return finishMemberWithDetails(baseMember, memberValue);

            case 'AS-SET': {
                if (typeof value !== 'string') {
                    throw new Error(`Invalid AS_SET value: ${value}`);
                }
                let name = value,
                    source;
                if (value.includes('::')) {
                    [source, name] = value.split('::');
                }
                baseMember = new AS_SET_Member({
                    setName: name,
                    sources: source ? [source] : undefined,
                    flatten: false,
                });
                return finishMemberWithDetails(baseMember, memberValue);
            }

            default:
                throw new Error(`Unsupported member type: ${type}`);
        }
    }

    throw new Error(`Invalid member object: ${JSON.stringify(member)}`);
}

export function parseContent(yamlContent: string): easy_as_set.Content {
    const parsed = parse(yamlContent) as any as easy_as_set.contentConf.context;

    if (
        !parsed ||
        typeof parsed !== 'object' ||
        !('name' in parsed) ||
        !('members' in parsed)
    ) {
        throw new Error("Invalid content format: missing 'name' or 'members'");
    }

    const { name, members } = parsed;

    if (typeof name !== 'string') {
        throw new Error("Invalid content format: 'name' must be a string");
    }

    if (!Array.isArray(members)) {
        throw new Error("Invalid content format: 'members' must be an array");
    }

    const parsedMembers = members.map(parseMember);

    return new Content(name, parsedMembers);
}

export default parseContent;
