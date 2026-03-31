import {
    buildAuthContext,
    hasResourcePermission,
    requireResourcePermission,
} from '../authorization';
import { HttpError } from '../errors';

describe('resource-level authorization', () => {
    test('allows object-bound permission with matching rule', () => {
        const context = buildAuthContext(
            {
                issuer: 'https://issuer.example',
                subject: 'alice',
                scopes: ['irrobject:read', 'irrcontent:read'],
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
                resourceRules: [
                    {
                        resource: 'irrobject',
                        action: 'read',
                        objectPattern: 'as-example-*',
                    },
                    {
                        resource: 'irrcontent',
                        action: 'read',
                        objectPattern: 'as-example-*',
                    },
                ],
                createdAt: '2024-01-01T00:00:00.000Z',
                updatedAt: '2024-01-01T00:00:00.000Z',
            },
        );

        expect(
            hasResourcePermission(context, 'irrobject', 'read', {
                identifiers: ['as-example-1'],
                source: 'RIPE',
                type: 'as-set',
            }),
        ).toBe(true);
    });

    test('rejects when scope exists but no matching object rule', () => {
        const context = buildAuthContext(
            {
                issuer: 'https://issuer.example',
                subject: 'alice',
                scopes: ['irrobject:read'],
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
                resourceRules: [
                    {
                        resource: 'irrobject',
                        action: 'read',
                        objectPattern: 'as-team-*',
                    },
                ],
                createdAt: '2024-01-01T00:00:00.000Z',
                updatedAt: '2024-01-01T00:00:00.000Z',
            },
        );

        expect(() =>
            requireResourcePermission(context, 'irrobject', 'read', {
                identifiers: ['as-other-1'],
                source: 'RIPE',
                type: 'as-set',
            }),
        ).toThrow(HttpError);
    });

    test('checks source/type pattern when rule specifies them', () => {
        const context = buildAuthContext(
            {
                issuer: 'https://issuer.example',
                subject: 'alice',
                scopes: ['irrobject:read'],
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
                resourceRules: [
                    {
                        resource: 'irrobject',
                        action: 'read',
                        objectPattern: 'as-*',
                        sourcePattern: 'RIPE',
                        typePattern: 'as-set',
                    },
                ],
                createdAt: '2024-01-01T00:00:00.000Z',
                updatedAt: '2024-01-01T00:00:00.000Z',
            },
        );

        expect(
            hasResourcePermission(context, 'irrobject', 'read', {
                identifiers: ['as-example-1'],
                source: 'RIPE',
                type: 'as-set',
            }),
        ).toBe(true);

        expect(
            hasResourcePermission(context, 'irrobject', 'read', {
                identifiers: ['as-example-1'],
                source: 'RADB',
                type: 'as-set',
            }),
        ).toBe(false);
    });
});
