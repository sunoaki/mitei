import { XMLParser } from 'fast-xml-parser';
import Type from 'typebox';
import Value from 'typebox/value';

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    textNodeName: '#text',
    removeNSPrefix: true,
});

const arinErrorSchema = Type.Object(
    {
        error: Type.Object(
            {
                code: Type.Union([Type.String(), Type.Number()]),
                message: Type.String(),
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

export const resolveErrorMessage = (
    xmlData: string,
): {
    errorCode: string;
    errorMessage: string;
} => {
    const parsedData = parser.parse(xmlData) as unknown;

    if (!Value.Check(arinErrorSchema, parsedData)) {
        const [firstError] = Value.Errors(arinErrorSchema, parsedData);
        const path = firstError?.instancePath
            ? `$${firstError.instancePath}`
            : '$';
        const message = firstError?.message ?? 'schema validation failed';
        throw new Error(`Invalid ARIN error XML: ${path} ${message}`);
    }

    return {
        errorCode: String(parsedData.error.code).trim(),
        errorMessage: parsedData.error.message.trim(),
    };
};
