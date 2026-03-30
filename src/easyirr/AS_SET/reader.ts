import { parse } from 'yaml';
import { ASN_Member } from './member/asn';
import { AS_SET_Member } from './member/as_set';
import { Content } from './member/content';
import easy_as_set from './types';
import {
    assertValid,
    asnMemberOptionsSchema,
    asSetMemberOptionsSchema,
    contentSchema,
    memberObjectSchema,
    omittedMemberSchema,
    primitiveMemberSchema,
    typedASNMemberSchema,
    typedASSETMemberSchema,
} from './schema';

export function generateMemberByName(member: unknown): easy_as_set.Member {
    assertValid(primitiveMemberSchema, member, 'member');

    switch (typeof member) {
        case 'number':
            return new ASN_Member(member);
        case 'string':
            if (member.startsWith('AS')) {
                // may be AS_NUMBER or AS_SET, but we can only determine it after parsing the content.
                const asn = parseInt(member.slice(2), 10);
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
    member: unknown,
): easy_as_set.Member {
    if (['number', 'string'].includes(typeof member)) {
        return generateMemberByName(member);
    }

    assertValid(memberObjectSchema, member, 'member object');

    const finishMemberWithDetails = (
        baseMember: easy_as_set.Member,
        memberValue: unknown,
    ) => {
        const normalizeRemarks = (remarks?: string | string[]) => {
            if (typeof remarks === 'string') return [remarks];
            return remarks;
        };

        if (baseMember instanceof ASN_Member) {
            assertValid(asnMemberOptionsSchema, memberValue, 'ASN member options');
            if ('remarks' in memberValue)
                baseMember.remarks = normalizeRemarks(memberValue?.remarks);
            return baseMember;
        }

        if (baseMember instanceof AS_SET_Member) {
            assertValid(
                asSetMemberOptionsSchema,
                memberValue,
                'AS-SET member options',
            );

            const baseOptions = memberValue;

            if (typeof baseOptions.flatten === 'boolean')
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

    if (!('type' in member && 'value' in member)) {
        assertValid(omittedMemberSchema, member, 'omitted member object');

        const memberRecord = member as Record<string, unknown>;
        const key = Object.keys(memberRecord)[0];
        const memberValue = memberRecord[key] ?? {};
        const baseMember = generateMemberByName(String(key));
        return finishMemberWithDetails(baseMember, memberValue);
    }

    let baseMember: easy_as_set.Member;

    switch (member.type) {
        case 'ASN': {
            assertValid(typedASNMemberSchema, member, 'typed ASN member');

            const { value, ...memberValue } = member;

            if (typeof value === 'number') {
                baseMember = new ASN_Member(value);
            } else {
                const normalizedValue = value.trim().toUpperCase();

                if (!normalizedValue.startsWith('AS')) {
                    throw new Error(`Invalid AS_NUMBER value: ${value}`);
                }

                const asn = parseInt(normalizedValue.slice(2), 10);
                if (isNaN(asn)) {
                    throw new Error(`Invalid AS_NUMBER value: ${value}`);
                }

                baseMember = new ASN_Member(asn);
            }

            return finishMemberWithDetails(baseMember, memberValue);
        }

        case 'AS-SET': {
            assertValid(typedASSETMemberSchema, member, 'typed AS-SET member');

            const { value, ...memberValue } = member;

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
            throw new Error(`Unsupported member type: ${member.type}`);
    }
}

export function parseContent(yamlContent: string): easy_as_set.Content {
    const parsed = parse(yamlContent) as unknown;

    assertValid(contentSchema, parsed, 'content format');

    const parsedMembers = parsed.members.map(parseMember);

    return new Content(parsed.name, parsedMembers);
}

export default parseContent;
