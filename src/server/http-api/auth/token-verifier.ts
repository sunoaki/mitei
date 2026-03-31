import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { AuthConfig, TokenPrincipal } from './types';
import { HttpError } from './errors';

function parseScopeClaim(value: unknown): string[] {
    if (typeof value === 'string') {
        return value
            .split(/[\s,]+/)
            .map((scope) => scope.trim())
            .filter((scope) => scope.length > 0);
    }

    if (Array.isArray(value)) {
        return value
            .map((scope) => (typeof scope === 'string' ? scope.trim() : ''))
            .filter((scope) => scope.length > 0);
    }

    return [];
}

function getBearerToken(header: string | undefined): string {
    if (!header) {
        throw new HttpError(
            401,
            'UNAUTHORIZED',
            'Missing Authorization header.',
        );
    }

    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match) {
        throw new HttpError(
            401,
            'UNAUTHORIZED',
            'Authorization header must be a Bearer token.',
        );
    }

    const token = match[1].trim();
    if (!token) {
        throw new HttpError(401, 'UNAUTHORIZED', 'Bearer token is empty.');
    }

    return token;
}

function isLikelyJwt(token: string): boolean {
    return token.split('.').length === 3;
}

async function verifyJwtToken(
    token: string,
    config: AuthConfig,
): Promise<TokenPrincipal> {
    const jwksUri =
        config.jwksUri ??
        `${config.issuer.replace(/\/$/, '')}/.well-known/jwks.json`;
    const jwks = createRemoteJWKSet(new URL(jwksUri));

    const verification = await jwtVerify(token, jwks, {
        issuer: config.issuer,
        audience: config.audience,
    });

    const payload = verification.payload as Record<string, unknown>;
    const subject = typeof payload.sub === 'string' ? payload.sub : undefined;

    if (!subject) {
        throw new HttpError(
            401,
            'UNAUTHORIZED',
            'JWT subject (sub) is missing.',
        );
    }

    return {
        issuer: typeof payload.iss === 'string' ? payload.iss : config.issuer,
        subject,
        scopes: parseScopeClaim(payload.scope),
        tokenType: 'jwt',
        rawClaims: payload,
    };
}

async function introspectOpaqueToken(
    token: string,
    config: AuthConfig,
): Promise<TokenPrincipal> {
    if (!config.introspectionEndpoint) {
        throw new HttpError(
            401,
            'UNAUTHORIZED',
            'Opaque token provided but MITEI_OIDC_INTROSPECTION_ENDPOINT is not configured.',
        );
    }

    const headers: Record<string, string> = {
        'content-type': 'application/x-www-form-urlencoded',
    };

    if (config.clientId && config.clientSecret) {
        const basic = Buffer.from(
            `${config.clientId}:${config.clientSecret}`,
        ).toString('base64');
        headers.authorization = `Basic ${basic}`;
    }

    const body = new URLSearchParams({ token });
    if (config.clientId) {
        body.set('client_id', config.clientId);
    }
    if (config.clientSecret) {
        body.set('client_secret', config.clientSecret);
    }

    const response = await fetch(config.introspectionEndpoint, {
        method: 'POST',
        headers,
        body,
    });

    if (!response.ok) {
        throw new HttpError(401, 'UNAUTHORIZED', 'Token introspection failed.');
    }

    const data = (await response.json()) as Record<string, unknown>;
    const active = data.active === true;

    if (!active) {
        throw new HttpError(401, 'UNAUTHORIZED', 'Opaque token is inactive.');
    }

    const subject = typeof data.sub === 'string' ? data.sub : undefined;
    if (!subject) {
        throw new HttpError(
            401,
            'UNAUTHORIZED',
            'Opaque token subject (sub) is missing.',
        );
    }

    const issuer =
        (typeof data.iss === 'string' && data.iss.trim().length > 0
            ? data.iss
            : config.issuer) || config.issuer;

    return {
        issuer,
        subject,
        scopes: parseScopeClaim(data.scope),
        tokenType: 'opaque',
        rawClaims: data,
    };
}

export interface TokenVerifier {
    verifyAuthorizationHeader(
        authorizationHeader: string | undefined,
    ): Promise<TokenPrincipal>;
}

export function createTokenVerifier(config: AuthConfig): TokenVerifier {
    if (config.mode === 'disabled') {
        return {
            async verifyAuthorizationHeader(
                authorizationHeader: string | undefined,
            ): Promise<TokenPrincipal> {
                const subject = getBearerToken(authorizationHeader);
                return {
                    issuer: config.issuer,
                    subject,
                    scopes: [],
                    tokenType: 'dev',
                    rawClaims: {},
                };
            },
        };
    }

    return {
        async verifyAuthorizationHeader(
            authorizationHeader: string | undefined,
        ): Promise<TokenPrincipal> {
            const token = getBearerToken(authorizationHeader);

            try {
                if (isLikelyJwt(token)) {
                    return await verifyJwtToken(token, config);
                }

                return await introspectOpaqueToken(token, config);
            } catch (error) {
                if (error instanceof HttpError) {
                    throw error;
                }

                throw new HttpError(
                    401,
                    'UNAUTHORIZED',
                    'Token verification failed.',
                );
            }
        },
    };
}
