import Type from 'typebox';
import type { FastifyInstance } from 'fastify';
import { HttpError } from '../auth/errors';
import { asRole, asScope, roleNames } from '../auth/permissions';
import { listKnownScopes } from '../auth/authorization';
import type { UserStore } from './repository/user-store';
import { registerManagePrivilegeRoutes } from './manage-priv';
import type { RoleName, Scope } from '../auth/permissions';

interface UserRoutesOptions {
    userStore: UserStore;
}

const createUserBodySchema = Type.Object({
    issuer: Type.String({ minLength: 1 }),
    subject: Type.String({ minLength: 1 }),
    displayName: Type.String({ minLength: 1 }),
    email: Type.Optional(Type.String({ minLength: 3 })),
    roles: Type.Optional(Type.Array(Type.String({ minLength: 1 }))),
    grantScopes: Type.Optional(Type.Array(Type.String({ minLength: 1 }))),
    denyScopes: Type.Optional(Type.Array(Type.String({ minLength: 1 }))),
    resourceRules: Type.Optional(
        Type.Array(
            Type.Object({
                resource: Type.Union([
                    Type.Literal('irrobject'),
                    Type.Literal('irrcontent'),
                ]),
                action: Type.Union([
                    Type.Literal('read'),
                    Type.Literal('write'),
                ]),
                objectPattern: Type.String({ minLength: 1 }),
                sourcePattern: Type.Optional(Type.String({ minLength: 1 })),
                typePattern: Type.Optional(Type.String({ minLength: 1 })),
            }),
        ),
    ),
});

const updateUserBodySchema = Type.Object({
    displayName: Type.Optional(Type.String({ minLength: 1 })),
    email: Type.Optional(Type.String({ minLength: 3 })),
    resourceRules: Type.Optional(
        Type.Array(
            Type.Object({
                resource: Type.Union([
                    Type.Literal('irrobject'),
                    Type.Literal('irrcontent'),
                ]),
                action: Type.Union([
                    Type.Literal('read'),
                    Type.Literal('write'),
                ]),
                objectPattern: Type.String({ minLength: 1 }),
                sourcePattern: Type.Optional(Type.String({ minLength: 1 })),
                typePattern: Type.Optional(Type.String({ minLength: 1 })),
            }),
        ),
    ),
});

const enableBodySchema = Type.Object({
    enabled: Type.Boolean(),
});

function sanitizeUserOutput(user: Awaited<ReturnType<UserStore['getById']>>) {
    return user;
}

function isRoleName(value: RoleName | undefined): value is RoleName {
    return Boolean(value);
}

function isScope(value: Scope | undefined): value is Scope {
    return Boolean(value);
}

export async function registerUserRoutes(
    fastify: FastifyInstance,
    options: UserRoutesOptions,
): Promise<void> {
    fastify.get(
        '/roles',
        {
            schema: {
                tags: ['Users'],
                description: 'List available roles and known scopes.',
            },
        },
        async (request) => {
            await fastify.authenticate(request);
            fastify.requireScopes(request, ['users:read']);

            return {
                roles: roleNames,
                scopes: listKnownScopes(),
            };
        },
    );

    fastify.get(
        '/me',
        {
            schema: {
                tags: ['Users'],
                description:
                    'Get the current authenticated user and effective scopes.',
            },
        },
        async (request) => {
            await fastify.authenticate(request);

            if (!request.authContext) {
                throw new HttpError(
                    401,
                    'UNAUTHORIZED',
                    'Authentication failed.',
                );
            }

            return {
                principal: request.authContext.principal,
                user: request.authContext.user,
                effectiveScopes: [...request.authContext.effectiveScopes],
            };
        },
    );

    fastify.get(
        '/users',
        {
            schema: {
                tags: ['Users'],
                description: 'List users.',
            },
        },
        async (request) => {
            await fastify.authenticate(request);
            fastify.requireScopes(request, ['users:read']);

            const users = await options.userStore.list();
            return users.map((user) => sanitizeUserOutput(user));
        },
    );

    fastify.post(
        '/users',
        {
            schema: {
                tags: ['Users'],
                description: 'Create a new user.',
                body: createUserBodySchema,
            },
        },
        async (request, reply) => {
            await fastify.authenticate(request);
            fastify.requireScopes(request, ['users:write']);

            const body = request.body as {
                issuer: string;
                subject: string;
                displayName: string;
                email?: string;
                roles?: string[];
                grantScopes?: string[];
                denyScopes?: string[];
                resourceRules?: Array<{
                    resource: 'irrobject' | 'irrcontent';
                    action: 'read' | 'write';
                    objectPattern: string;
                    sourcePattern?: string;
                    typePattern?: string;
                }>;
            };

            const roles = (body.roles ?? ['viewer']).map((role) =>
                asRole(role),
            );
            if (roles.some((role) => !role)) {
                throw new HttpError(
                    422,
                    'VALIDATION_ERROR',
                    'Unknown role in roles field.',
                );
            }

            const grantScopes = (body.grantScopes ?? []).map((scope) =>
                asScope(scope),
            );
            if (grantScopes.some((scope) => !scope)) {
                throw new HttpError(
                    422,
                    'VALIDATION_ERROR',
                    'Unknown scope in grantScopes field.',
                );
            }

            const denyScopes = (body.denyScopes ?? []).map((scope) =>
                asScope(scope),
            );
            if (denyScopes.some((scope) => !scope)) {
                throw new HttpError(
                    422,
                    'VALIDATION_ERROR',
                    'Unknown scope in denyScopes field.',
                );
            }

            const created = await options.userStore.create({
                issuer: body.issuer,
                subject: body.subject,
                displayName: body.displayName,
                email: body.email,
                roles: roles.filter(isRoleName),
                grantScopes: grantScopes.filter(isScope),
                denyScopes: denyScopes.filter(isScope),
                resourceRules: body.resourceRules ?? [],
            });

            reply.code(201);
            return sanitizeUserOutput(created);
        },
    );

    fastify.get(
        '/users/:id',
        {
            schema: {
                tags: ['Users'],
                description: 'Get user by id.',
            },
        },
        async (request) => {
            await fastify.authenticate(request);
            fastify.requireScopes(request, ['users:read']);

            const params = request.params as { id: string };
            const user = await options.userStore.getById(params.id);

            if (!user) {
                throw new HttpError(404, 'NOT_FOUND', 'User not found.');
            }

            return sanitizeUserOutput(user);
        },
    );

    fastify.patch(
        '/users/:id',
        {
            schema: {
                tags: ['Users'],
                description: 'Update user profile fields.',
                body: updateUserBodySchema,
            },
        },
        async (request) => {
            await fastify.authenticate(request);
            fastify.requireScopes(request, ['users:write']);

            const params = request.params as { id: string };
            const body = request.body as {
                displayName?: string;
                email?: string;
                resourceRules?: Array<{
                    resource: 'irrobject' | 'irrcontent';
                    action: 'read' | 'write';
                    objectPattern: string;
                    sourcePattern?: string;
                    typePattern?: string;
                }>;
            };
            return options.userStore.update(params.id, body);
        },
    );

    fastify.patch(
        '/users/:id/enabled',
        {
            schema: {
                tags: ['Users'],
                description: 'Enable or disable user.',
                body: enableBodySchema,
            },
        },
        async (request) => {
            await fastify.authenticate(request);
            fastify.requireScopes(request, ['users:manage']);

            const params = request.params as { id: string };
            const body = request.body as { enabled: boolean };
            return options.userStore.setEnabled(params.id, body.enabled);
        },
    );

    fastify.delete(
        '/users/:id',
        {
            schema: {
                tags: ['Users'],
                description: 'Delete a user.',
            },
        },
        async (request, reply) => {
            await fastify.authenticate(request);
            fastify.requireScopes(request, ['users:manage']);

            const params = request.params as { id: string };
            await options.userStore.remove(params.id);
            reply.code(204);
            return null;
        },
    );

    await fastify.register(
        async (scopedFastify) => {
            await registerManagePrivilegeRoutes(scopedFastify, {
                userStore: options.userStore,
            });
        },
        { prefix: '/users' },
    );
}
