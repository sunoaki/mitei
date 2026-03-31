import Type, { type Static, type TSchema } from 'typebox';
import Value from 'typebox/value';
import type { AuthConfig } from './types';

const authConfigSchema = Type.Object({
    mode: Type.Optional(
        Type.Union([Type.Literal('enforce'), Type.Literal('disabled')]),
    ),
    issuer: Type.Optional(Type.String({ minLength: 1 })),
    audience: Type.Optional(Type.String({ minLength: 1 })),
    jwksUri: Type.Optional(Type.String({ minLength: 1 })),
    introspectionEndpoint: Type.Optional(Type.String({ minLength: 1 })),
    clientId: Type.Optional(Type.String({ minLength: 1 })),
    clientSecret: Type.Optional(Type.String({ minLength: 1 })),
});

function assertValid<Schema extends TSchema>(
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

function normalizeEnvValue(key: string): string | undefined {
    const value = process.env[key];
    if (!value) return undefined;

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

export function loadAuthConfigFromEnv(): AuthConfig {
    const raw = {
        mode: normalizeEnvValue('MITEI_AUTH_MODE'),
        issuer: normalizeEnvValue('MITEI_OIDC_ISSUER'),
        audience: normalizeEnvValue('MITEI_OIDC_AUDIENCE'),
        jwksUri: normalizeEnvValue('MITEI_OIDC_JWKS_URI'),
        introspectionEndpoint: normalizeEnvValue(
            'MITEI_OIDC_INTROSPECTION_ENDPOINT',
        ),
        clientId: normalizeEnvValue('MITEI_OIDC_CLIENT_ID'),
        clientSecret: normalizeEnvValue('MITEI_OIDC_CLIENT_SECRET'),
    };

    assertValid(authConfigSchema, raw, 'http-api auth config');

    const mode = raw.mode ?? 'enforce';
    if (mode === 'disabled') {
        return {
            mode,
            issuer: raw.issuer ?? 'dev',
            audience: raw.audience,
            jwksUri: raw.jwksUri,
            introspectionEndpoint: raw.introspectionEndpoint,
            clientId: raw.clientId,
            clientSecret: raw.clientSecret,
        };
    }

    if (!raw.issuer) {
        throw new Error(
            'MITEI_OIDC_ISSUER is required when auth mode is enforce.',
        );
    }

    return {
        mode,
        issuer: raw.issuer,
        audience: raw.audience,
        jwksUri: raw.jwksUri,
        introspectionEndpoint: raw.introspectionEndpoint,
        clientId: raw.clientId,
        clientSecret: raw.clientSecret,
    };
}
