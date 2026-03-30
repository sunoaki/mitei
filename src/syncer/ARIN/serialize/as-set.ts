import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import Type, { type Static } from 'typebox';
import Value from 'typebox/value';

import {
    ASSetContent,
    ASSetMember,
    ASSetObject,
} from '../../../core/IRR/AS_SET/index';
import { IRR } from '../../../core/IRR/types';

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    textNodeName: '#text',
    removeNSPrefix: true,
});

const builder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    format: true,
    indentBy: '    ',
    suppressEmptyNode: true,
});

const arinPOCLinkRefSchema = Type.Object(
    {
        description: Type.Optional(Type.String()),
        function: Type.Optional(Type.String()),
        handle: Type.Optional(Type.String()),
    },
    {
        additionalProperties: true,
    },
);

const arinDescriptionLineNodeSchema = Type.Object(
    {
        '#text': Type.Optional(Type.String()),
    },
    {
        additionalProperties: true,
    },
);

const arinMemberNodeSchema = Type.Object(
    {
        name: Type.Optional(Type.String()),
        '#text': Type.Optional(Type.String()),
    },
    {
        additionalProperties: true,
    },
);

const arinAsSetPayloadSchema = Type.Object(
    {
        asSet: Type.Object(
            {
                name: Type.Optional(Type.String()),
                source: Type.Optional(Type.String()),
                orgHandle: Type.Optional(Type.String()),
                creationDate: Type.Optional(Type.String()),
                lastModifiedDate: Type.Optional(Type.String()),
                pocLinks: Type.Optional(
                    Type.Object(
                        {
                            pocLinkRef: Type.Optional(
                                Type.Union([
                                    arinPOCLinkRefSchema,
                                    Type.Array(arinPOCLinkRefSchema),
                                ]),
                            ),
                        },
                        {
                            additionalProperties: true,
                        },
                    ),
                ),
                description: Type.Optional(
                    Type.Object(
                        {
                            line: Type.Optional(
                                Type.Union([
                                    Type.String(),
                                    arinDescriptionLineNodeSchema,
                                    Type.Array(
                                        Type.Union([
                                            Type.String(),
                                            arinDescriptionLineNodeSchema,
                                        ]),
                                    ),
                                ]),
                            ),
                        },
                        {
                            additionalProperties: true,
                        },
                    ),
                ),
                members: Type.Optional(
                    Type.Object(
                        {
                            member: Type.Optional(
                                Type.Union([
                                    Type.String(),
                                    arinMemberNodeSchema,
                                    Type.Array(
                                        Type.Union([
                                            Type.String(),
                                            arinMemberNodeSchema,
                                        ]),
                                    ),
                                ]),
                            ),
                        },
                        {
                            additionalProperties: true,
                        },
                    ),
                ),
            },
            {
                additionalProperties: true,
            },
        ),
    },
    {
        additionalProperties: true,
    },
);

type ARINAsSetPayload = Static<typeof arinAsSetPayloadSchema>;

function assertValidArinAsSetPayload(
    payload: unknown,
): asserts payload is ARINAsSetPayload {
    if (Value.Check(arinAsSetPayloadSchema, payload)) {
        return;
    }

    const [firstError] = Value.Errors(arinAsSetPayloadSchema, payload);
    const path = firstError?.instancePath ? `$${firstError.instancePath}` : '$';
    const message = firstError?.message ?? 'schema validation failed';
    throw new Error(`Invalid ARIN AS-SET XML payload: ${path} ${message}`);
}

/**
    * ARIN AS-SET Object
    * https://www.arin.net/resources/manage/irr/irr-restful/#creating-an-as-set-object
    * 
    * Example XML Response:
    ```
    <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <asSet xmlns="http://www.arin.net/regrws/core/v1" >
    <creationDate>2021-05-27T18:24:28Z</creationDate>
    <description>
        <line number="0">peers in AZ network</line>
    </description>
    <lastModifiedDate>2021-05-27T18:24:28Z</lastModifiedDate>
    <orgHandle>EXAMPLECORP</orgHandle>
    <pocLinks>
        <pocLinkRef description="Tech" function="T" handle="EXAMPLETECH"/>
        <pocLinkRef description="Routing" function="R" handle="EXAMPLEROUT"/>
        <pocLinkRef description="Admin" function="AD" handle="EXAMPLEADMIN"/>
    </pocLinks>
    <source>ARIN</source>
    <members>
        <member name="AS-PHOENIX"/>
        <member name="AS-MESA"/>
        <member name="AS-SEDONA"/>
    </members>
    <name>AS-EXAMPLE-ARIZ</name>
    </asSet>
    ```

    * @param xmlData - The XML string response from ARIN's AS-SET query.
    * @returns An ASSetObject representing the AS-SET data.
*/
export const xmlToASSetObject = (xmlData: string): ASSetObject => {
    const parsedPayload = parser.parse(xmlData) as unknown;
    assertValidArinAsSetPayload(parsedPayload);

    const asSet = parsedPayload.asSet;

    const normalizeArray = <T>(value?: T | T[]): T[] => {
        if (value === undefined) return [];
        return Array.isArray(value) ? value : [value];
    };

    const extractText = (value: string | { '#text'?: string }): string => {
        if (typeof value === 'string') return value;
        return value['#text'] ?? '';
    };

    const name = (asSet.name ?? '').trim();
    if (!name) {
        throw new Error('Invalid ARIN AS-SET XML: missing <name> value.');
    }

    const source = ((asSet.source ?? IRR.Source.ARIN) as string)
        .trim()
        .toUpperCase() as IRR.Source;

    const mnt_by = (() => {
        const orgHandle = (asSet.orgHandle ?? '').trim();
        if (!orgHandle) return undefined;
        return [{ name: orgHandle, source }];
    })();

    const toContactType = (poc: {
        description?: string;
        function?: string;
    }): string | undefined => {
        const description = (poc.description ?? '').trim().toLowerCase();
        const func = (poc.function ?? '').trim().toUpperCase();

        if (description === 'admin' || func === 'AD') return 'admin-c';
        if (description === 'tech' || func === 'T') return 'tech-c';
        if (description === 'routing' || func === 'R') return 'route-c';
        return description;
    };

    const contact = normalizeArray(asSet.pocLinks?.pocLinkRef)
        .map((poc) => {
            const name = (poc.handle ?? '').trim();
            const type = toContactType(poc);
            if (!name || !type) return undefined;
            return { name, type, source };
        })
        .filter(
            (
                item,
            ): item is { name: string; type: string; source: IRR.Source } =>
                item !== undefined,
        );

    const parsedMembers = normalizeArray(asSet.members?.member)
        .map((member) => {
            if (typeof member === 'string') return member.trim();
            return (member.name ?? member['#text'] ?? '').trim();
        })
        .filter((memberName) => memberName.length > 0)
        .map((memberName) => new ASSetMember(memberName));

    const content = new ASSetContent(parsedMembers);

    const descriptions = normalizeArray(asSet.description?.line)
        .map((line) => extractText(line).trim())
        .filter((line) => line.length > 0);

    if (descriptions.length > 0) {
        content.descriptions = descriptions;
    }

    const created = asSet.creationDate
        ? new Date(asSet.creationDate)
        : undefined;
    const last_modified = asSet.lastModifiedDate
        ? new Date(asSet.lastModifiedDate)
        : undefined;

    return new ASSetObject(
        name,
        source,
        content,
        mnt_by,
        contact.length > 0 ? contact : undefined,
        created,
        last_modified,
    );
};

/**
 *
 * Formatted to ARIN's specifications for AS-SET objects.
 *
 * @param asSet An ASSetObject representing the AS-SET data.
 * @return A string containing the XML representation of the AS-SET object, formatted according to ARIN's specifications.
 *
 *
 */

export const asSetObjectToXML = (asSet: ASSetObject): string => {
    const toARINTimestamp = (date?: Date): string | undefined => {
        if (!date) return undefined;
        return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
    };

    const toPOCLinkRef = (contact: IRR.contact.reference) => {
        switch (contact.type.toLowerCase()) {
            case 'admin-c':
                return {
                    '@_description': 'Admin',
                    '@_function': 'AD',
                    '@_handle': contact.name,
                };
            case 'tech-c':
                return {
                    '@_description': 'Tech',
                    '@_function': 'T',
                    '@_handle': contact.name,
                };
            case 'route-c':
                return {
                    '@_description': 'Routing',
                    '@_function': 'R',
                    '@_handle': contact.name,
                };
            default:
                return undefined;
        }
    };

    const descriptions = (asSet.content.descriptions ?? [])
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line, index) => ({
            '@_number': String(index),
            '#text': line,
        }));

    const members = asSet.content.members.map((member) => ({
        '@_name': member.name,
    }));

    const pocLinkRef = (asSet.contact ?? [])
        .filter((contact) => contact.name && contact.name.trim().length > 0)
        .map(toPOCLinkRef)
        .filter(
            (
                item,
            ): item is {
                '@_description': string;
                '@_function': string;
                '@_handle': string;
            } => item !== undefined,
        );

    const xmlObject = {
        '?xml': {
            '@_version': '1.0',
            '@_encoding': 'UTF-8',
            '@_standalone': 'yes',
        },
        asSet: {
            '@_xmlns': 'http://www.arin.net/regrws/core/v1',
            creationDate: toARINTimestamp(asSet.created),
            description: { line: descriptions },
            lastModifiedDate: toARINTimestamp(asSet.last_modified),
            orgHandle:
                asSet.mnt_by && asSet.mnt_by.length > 0
                    ? asSet.mnt_by[0].name
                    : undefined,
            pocLinks: pocLinkRef.length > 0 ? { pocLinkRef } : undefined,
            source: asSet.source,
            members: members.length > 0 ? { member: members } : undefined,
            name: asSet.name,
        },
    };

    return builder.build(xmlObject);
};
