import Type, { type Static, type TSchema } from 'typebox';
import Value from 'typebox/value';

const remarksSchema = Type.Union([Type.String(), Type.Array(Type.String())]);

export const asnMemberOptionsSchema = Type.Object(
    {
        remarks: Type.Optional(remarksSchema),
    },
    {
        additionalProperties: true,
    },
);

export const asSetMemberOptionsSchema = Type.Object(
    {
        flatten: Type.Optional(Type.Boolean()),
        depth: Type.Optional(Type.Number()),
        sources: Type.Optional(
            Type.Union([Type.String(), Type.Array(Type.String())]),
        ),
        exclude: Type.Optional(Type.Array(Type.Any())),
        irrdGraphQLEndpoint: Type.Optional(Type.String()),
        remarks: Type.Optional(remarksSchema),
    },
    {
        additionalProperties: true,
    },
);

export const primitiveMemberSchema = Type.Union([Type.Number(), Type.String()]);

export const typedASNMemberSchema = Type.Object(
    {
        type: Type.Literal('ASN'),
        value: Type.Union([Type.Number(), Type.String()]),
        remarks: Type.Optional(remarksSchema),
    },
    {
        additionalProperties: true,
    },
);

export const typedASSETMemberSchema = Type.Object(
    {
        type: Type.Literal('AS-SET'),
        value: Type.String(),
        flatten: Type.Optional(Type.Boolean()),
        depth: Type.Optional(Type.Number()),
        sources: Type.Optional(
            Type.Union([Type.String(), Type.Array(Type.String())]),
        ),
        exclude: Type.Optional(Type.Array(Type.Any())),
        irrdGraphQLEndpoint: Type.Optional(Type.String()),
        remarks: Type.Optional(remarksSchema),
    },
    {
        additionalProperties: true,
    },
);

const omittedMemberValueSchema = Type.Union([
    asnMemberOptionsSchema,
    asSetMemberOptionsSchema,
]);

export const omittedMemberSchema = Type.Record(
    Type.String({ minLength: 1 }),
    omittedMemberValueSchema,
    {
        minProperties: 1,
        maxProperties: 1,
    },
);

export const memberObjectSchema = Type.Union([
    omittedMemberSchema,
    typedASNMemberSchema,
    typedASSETMemberSchema,
]);

export const contextMemberSchema = Type.Union([
    primitiveMemberSchema,
    memberObjectSchema,
]);

export const contentSchema = Type.Object(
    {
        name: Type.String(),
        members: Type.Array(contextMemberSchema),
    },
    {
        additionalProperties: true,
    },
);

export function assertValid<Schema extends TSchema>(
    schema: Schema,
    value: unknown,
    label: string,
): asserts value is Static<Schema> {
    if (Value.Check(schema, value)) {
        return;
    }

    const [firstError] = Value.Errors(schema, value);
    const path = firstError?.instancePath ? `$${firstError.instancePath}` : '$';
    const message = firstError?.message ?? 'schema validation failed';

    throw new Error(`Invalid ${label}: ${path} ${message}`);
}
