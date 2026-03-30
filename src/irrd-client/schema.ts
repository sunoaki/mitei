import Type, { type Static, type TSchema } from 'typebox';
import Value from 'typebox/value';

export const recursiveSetMembersItemSchema = Type.Object(
    {
        rpslPk: Type.String(),
        rootSource: Type.String(),
        members: Type.Union([Type.Array(Type.String()), Type.Null()]),
    },
    {
        additionalProperties: true,
    },
);

export const recursiveSetMembersResponseSchema = Type.Object(
    {
        recursiveSetMembers: Type.Array(recursiveSetMembersItemSchema),
    },
    {
        additionalProperties: true,
    },
);

export const rpslObjectsMntByItemSchema = Type.Object(
    {
        rpslPk: Type.Optional(Type.Union([Type.String(), Type.Null()])),
        source: Type.Optional(Type.Union([Type.String(), Type.Null()])),
        mntBy: Type.Optional(
            Type.Union([Type.Array(Type.String()), Type.Null()]),
        ),
    },
    {
        additionalProperties: true,
    },
);

export const rpslObjectsMntByResponseSchema = Type.Object(
    {
        rpslObjects: Type.Array(rpslObjectsMntByItemSchema),
    },
    {
        additionalProperties: true,
    },
);

export function assertValidIRRDResponse<Schema extends TSchema>(
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
    throw new Error(`Invalid IRRD ${label} response: ${path} ${message}`);
}
