import { XMLParser } from 'fast-xml-parser';
import { ASSetContent, ASSetMember, ASSetObject } from 'src/core/IRR/AS_SET';
import { IRR } from 'src/core/IRR/types';
import { asSetObjectToXML, xmlToASSetObject } from '../as-set';

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    textNodeName: '#text',
    removeNSPrefix: true,
});

describe('ARIN AS-SET XML serializer', () => {
    test('xmlToASSetObject parses rich XML payload', () => {
        const xml = `
<asSet>
  <creationDate>2024-01-01T00:00:00Z</creationDate>
  <description>
    <line number="0">first line</line>
    <line number="1">second line</line>
  </description>
  <lastModifiedDate>2024-01-02T00:00:00Z</lastModifiedDate>
  <orgHandle>EXAMPLEORG</orgHandle>
  <pocLinks>
    <pocLinkRef description="Tech" function="T" handle="TECH-HDL"/>
    <pocLinkRef description="Admin" function="AD" handle="ADMIN-HDL"/>
  </pocLinks>
  <source>arin</source>
  <members>
    <member name="AS65001"/>
    <member>AS65002</member>
  </members>
  <name>AS-EXAMPLE-ARIN</name>
</asSet>
`;

        const object = xmlToASSetObject(xml);

        expect(object.name).toBe('as-example-arin');
        expect(object.source).toBe(IRR.Source.ARIN);
        expect(object.mnt_by[0]).toEqual({ name: 'EXAMPLEORG', source: IRR.Source.ARIN });
        expect(object.contact).toEqual([
            { name: 'TECH-HDL', type: 'tech-c', source: IRR.Source.ARIN },
            { name: 'ADMIN-HDL', type: 'admin-c', source: IRR.Source.ARIN },
        ]);
        expect(object.content.members.map((m) => m.name)).toEqual(['AS65001', 'AS65002']);
        expect(object.content.descriptions).toEqual(['first line', 'second line']);
    });

    test('xmlToASSetObject throws for invalid payload and missing name', () => {
        expect(() => xmlToASSetObject('<invalid />')).toThrow(
            /Invalid ARIN AS-SET XML payload/,
        );

        expect(() =>
            xmlToASSetObject('<asSet><source>ARIN</source><name>   </name></asSet>'),
        ).toThrow(/missing <name> value/);
    });

    test('asSetObjectToXML renders arin-compatible structure and filters unsupported contacts', () => {
        const object = new ASSetObject(
            'AS-EXAMPLE-ARIN',
            IRR.Source.ARIN,
            new ASSetContent([
                new ASSetMember('AS65001', IRR.Source.undetermined),
                new ASSetMember('AS65002', IRR.Source.undetermined),
            ]),
            [{ name: 'EXAMPLEORG', source: IRR.Source.ARIN }],
            [
                { type: 'admin-c', name: 'ADMIN-HDL', source: IRR.Source.ARIN },
                { type: 'tech-c', name: 'TECH-HDL', source: IRR.Source.ARIN },
                { type: 'routing-c', name: 'ROUTE-HDL', source: IRR.Source.ARIN },
            ],
            new Date('2024-01-01T00:00:00.000Z'),
            new Date('2024-01-02T00:00:00.000Z'),
        );
        object.content.descriptions = ['desc line', ''];

        const xml = asSetObjectToXML(object);
        const parsed = parser.parse(xml);

        expect(parsed.asSet.orgHandle).toBe('EXAMPLEORG');
        expect(parsed.asSet.creationDate).toBe('2024-01-01T00:00:00Z');
        expect(parsed.asSet.lastModifiedDate).toBe('2024-01-02T00:00:00Z');

        const poc = parsed.asSet.pocLinks.pocLinkRef;
        expect(Array.isArray(poc)).toBe(true);
        expect(poc).toHaveLength(2);

        const members = parsed.asSet.members.member;
        expect(Array.isArray(members)).toBe(true);
        expect(members.map((m: { name: string }) => m.name)).toEqual([
            'AS65001',
            'AS65002',
        ]);
    });

    test('asSetObjectToXML omits optional blocks when empty', () => {
        const object = new ASSetObject(
            'AS-EMPTY-ARIN',
            IRR.Source.ARIN,
            new ASSetContent([]),
        );

        const xml = asSetObjectToXML(object);
        const parsed = parser.parse(xml);

        expect(parsed.asSet.members).toBeUndefined();
        expect(parsed.asSet.pocLinks).toBeUndefined();
    });
});
