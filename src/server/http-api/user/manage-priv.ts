import Type from 'typebox';
import type { FastifyInstance } from 'fastify';
import { asRole, asScope } from '../auth/permissions';
import { HttpError } from '../auth/errors';
import type { UserStore } from './repository/user-store';
import type { Scope } from '../auth/permissions';

interface ManagePrivilegeRoutesOptions {
    userStore: UserStore;
}

const roleBodySchema = Type.Object({
    role: Type.String({ minLength: 1 }),
});

const scopeOverrideBodySchema = Type.Object({
    grant: Type.Optional(Type.Array(Type.String({ minLength: 1 }))),
    deny: Type.Optional(Type.Array(Type.String({ minLength: 1 }))),
});

const resourceRuleBodySchema = Type.Object({
    rules: Type.Array(
        Type.Object({
            resource: Type.Union([
                Type.Literal('irrobject'),
                Type.Literal('irrcontent'),
            ]),
            action: Type.Union([Type.Literal('read'), Type.Literal('write')]),
            objectPattern: Type.String({ minLength: 1 }),
            sourcePattern: Type.Optional(Type.String({ minLength: 1 })),
            typePattern: Type.Optional(Type.String({ minLength: 1 })),
        }),
    ),
});

function isScope(value: Scope | undefined): value is Scope {
    return Boolean(value);
}

export async function registerManagePrivilegeRoutes(
    fastify: FastifyInstance,
    options: ManagePrivilegeRoutesOptions,
): Promise<void> {
    fastify.post(
        '/:id/roles',
        {
            schema: {
                tags: ['Users'],
                description: 'Assign a role to a user.',
                body: roleBodySchema,
            },
        },
        async (request) => {
            await fastify.authenticate(request);
            fastify.requireScopes(request, ['users:write']);

            const params = request.params as { id: string };
            const body = request.body as { role: string };

            const role = asRole(body.role);
            if (!role) {
                throw new HttpError(422, 'VALIDATION_ERROR', 'Invalid role.');
            }

            const user = await options.userStore.getById(params.id);
            if (!user) {
                throw new HttpError(404, 'NOT_FOUND', 'User not found.');
            }

            if (!user.roles.includes(role)) {
                user.roles.push(role);
            }

            return options.userStore.setRoles(user.id, user.roles);
        },
    );

    fastify.delete(
        '/:id/roles/:role',
        {
            schema: {
                tags: ['Users'],
                description: 'Remove a role from a user.',
            },
        },
        async (request) => {
            await fastify.authenticate(request);
            fastify.requireScopes(request, ['users:write']);

            const params = request.params as { id: string; role: string };
            const role = asRole(params.role);
            if (!role) {
                throw new HttpError(422, 'VALIDATION_ERROR', 'Invalid role.');
            }

            const user = await options.userStore.getById(params.id);
            if (!user) {
                throw new HttpError(404, 'NOT_FOUND', 'User not found.');
            }

            const nextRoles = user.roles.filter((item) => item !== role);
            return options.userStore.setRoles(user.id, nextRoles);
        },
    );

    fastify.patch(
        '/:id/scopes',
        {
            schema: {
                tags: ['Users'],
                description: 'Update user scope overrides (grant/deny).',
                body: scopeOverrideBodySchema,
            },
        },
        async (request) => {
            await fastify.authenticate(request);
            fastify.requireScopes(request, ['users:manage']);

            const params = request.params as { id: string };
            const body = request.body as { grant?: string[]; deny?: string[] };

            const grant = (body.grant ?? [])
                .map((scope) => asScope(scope))
                .filter(isScope);
            const deny = (body.deny ?? [])
                .map((scope) => asScope(scope))
                .filter(isScope);

            if ((body.grant ?? []).length !== grant.length) {
                throw new HttpError(
                    422,
                    'VALIDATION_ERROR',
                    'grant includes unknown scopes.',
                );
            }

            if ((body.deny ?? []).length !== deny.length) {
                throw new HttpError(
                    422,
                    'VALIDATION_ERROR',
                    'deny includes unknown scopes.',
                );
            }

            return options.userStore.update(params.id, {
                grantScopes: grant,
                denyScopes: deny,
            });
        },
    );

    fastify.patch(
        '/:id/resource-rules',
        {
            schema: {
                tags: ['Users'],
                description:
                    'Replace resource-level rules for irrobject/irrcontent granular authorization.',
                body: resourceRuleBodySchema,
            },
        },
        async (request) => {
            await fastify.authenticate(request);
            fastify.requireScopes(request, ['users:manage']);

            const params = request.params as { id: string };
            const body = request.body as {
                rules: Array<{
                    resource: 'irrobject' | 'irrcontent';
                    action: 'read' | 'write';
                    objectPattern: string;
                    sourcePattern?: string;
                    typePattern?: string;
                }>;
            };

            return options.userStore.update(params.id, {
                resourceRules: body.rules,
            });
        },
    );
}
