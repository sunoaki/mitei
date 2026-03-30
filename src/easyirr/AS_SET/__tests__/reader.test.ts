import { AS_SET_Member } from '../member/as_set';
import { ASN_Member } from '../member/asn';
import { Content } from '../member/content';
import { generateMemberByName, parseContent, parseMember } from '../reader';

describe('easyirr reader', () => {
    test('generateMemberByName creates ASN and AS-SET members', () => {
        const asn = generateMemberByName('AS65001');
        const set = generateMemberByName('RIPE::AS-EXAMPLE');

        expect(asn).toBeInstanceOf(ASN_Member);
        expect((asn as ASN_Member).asn).toBe(65001);

        expect(set).toBeInstanceOf(AS_SET_Member);
        expect((set as AS_SET_Member).setName).toBe('AS-EXAMPLE');
        expect((set as AS_SET_Member).sources).toEqual(['RIPE']);
    });

    test('parseMember supports omitted and typed styles', () => {
        const omitted = parseMember({
            AS65010: { remarks: 'from omitted style' },
        });

        const typed = parseMember({
            type: 'AS-SET',
            value: 'RADB::AS-UPSTREAM',
            flatten: true,
            depth: 2,
            sources: 'RIPE',
            remarks: ['typed style'],
        });

        expect(omitted).toBeInstanceOf(ASN_Member);
        expect((omitted as ASN_Member).remarks).toEqual(['from omitted style']);

        expect(typed).toBeInstanceOf(AS_SET_Member);
        const typedSet = typed as AS_SET_Member;
        expect(typedSet.setName).toBe('AS-UPSTREAM');
        expect(typedSet.flatten).toBe(true);
        expect(typedSet.depth).toBe(2);
        expect(typedSet.sources).toEqual(['RIPE']);
        expect(typedSet.remarks).toEqual(['typed style']);
    });

    test('parseContent builds Content object from yaml', () => {
        const yaml = `
name: site-members
members:
  - AS65020
  - AS-EDGE:
      flatten: false
`;

        const parsed = parseContent(yaml);

        expect(parsed).toBeInstanceOf(Content);
        expect(parsed.contentName).toBe('site-members');
        expect(parsed.members).toHaveLength(2);
    });

    test('parseContent rejects invalid shape', () => {
        const invalidYaml = `
name: missing-members
`;

        expect(() => parseContent(invalidYaml)).toThrow(/Invalid content format/);
    });
});
