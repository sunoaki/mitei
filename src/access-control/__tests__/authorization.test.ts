import { buildAuthContext, requireScopes } from '../authorization';
import { AccessControlError } from '../errors';

describe('access-control authorization', () => {
    test('intersects token scopes with local effective scopes', () => {
        const context = buildAuthContext(
            {
                issuer: 'https://issuer.example',
                subject: 'alice',
                scopes: ['syncer:read', 'users:manage'],
                tokenType: 'jwt',
                rawClaims: {},
            },
            {
                id: 'u1',
                issuer: 'https://issuer.example',
                subject: 'alice',
                displayName: 'Alice',
                enabled: true,
                roles: ['operator'],
                scopes: {
                    grant: ['users:read'],
                    deny: ['syncer:write'],
                },
                resourceRules: [
                    {
                        resource: 'irrobject',
                        action: 'read',
                        objectPattern: '*',
                    },
                ],
                createdAt: '2024-01-01T00:00:00.000Z',
                updatedAt: '2024-01-01T00:00:00.000Z',
            },
        );

        expect(context.effectiveScopes.has('syncer:read')).toBe(true);
        expect(context.effectiveScopes.has('syncer:write')).toBe(false);
        expect(context.effectiveScopes.has('users:manage')).toBe(false);
    });

    test('throws FORBIDDEN when required scopes are missing', () => {
        const context = buildAuthContext(
            {
                issuer: 'https://issuer.example',
                subject: 'alice',
                scopes: ['syncer:read'],
                tokenType: 'jwt',
                rawClaims: {},
            },
            {
                id: 'u1',
                issuer: 'https://issuer.example',
                subject: 'alice',
                displayName: 'Alice',
                enabled: true,
                roles: ['viewer'],
                scopes: {
                    grant: [],
                    deny: [],
                },
                resourceRules: [],
                createdAt: '2024-01-01T00:00:00.000Z',
                updatedAt: '2024-01-01T00:00:00.000Z',
            },
        );

        expect(() => requireScopes(context, ['users:manage'])).toThrow(
            AccessControlError,
        );
    });
});
