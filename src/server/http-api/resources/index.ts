import Type from 'typebox';
import type { FastifyInstance } from 'fastify';
import Mitei from '../../../core';
import { HttpError } from '../auth/errors';
import { ASSetObject } from '../../../core/IRR/AS_SET';
import { IRR } from '../../../core/IRR/types';
import {
    hasResourcePermission,
    requireResourcePermission,
    requireScopes,
} from '../auth/authorization';

interface ResourceRoutesOptions {
    mitei: Mitei;
}

const objectWriteBodySchema = Type.Object({
    rpsl: Type.String({ minLength: 1 }),
});

function selectObjects(
    mitei: Mitei,
    query: { name?: string; source?: string; type?: string; uuid?: string },
) {
    let selector = mitei.IRRManager.selector.clone();

    if (query.uuid) {
        selector = selector.selectByUUIDs([query.uuid]);
    }

    if (query.name) {
        selector = selector.selectByName(query.name.toLowerCase());
    }

    if (query.source) {
        selector = selector.selectBySource(
            query.source.toUpperCase() as IRR.Source,
        );
    }

    if (query.type) {
        selector = selector.selectByType(query.type.toLowerCase() as IRR.Type);
    }

    return selector;
}

export async function registerResourceRoutes(
    fastify: FastifyInstance,
    options: ResourceRoutesOptions,
): Promise<void> {
    fastify.get(
        '/syncers',
        {
            schema: {
                tags: ['Resources'],
                description: 'Read syncerList registrations.',
            },
        },
        async (request) => {
            await fastify.authenticate(request);
            fastify.requireScopes(request, ['syncer:read']);

            return Object.entries(options.mitei.syncerList).map(
                ([id, syncer]) => ({
                    id,
                    source: syncer.source,
                }),
            );
        },
    );

    fastify.post(
        '/syncers/:id/sync',
        {
            schema: {
                tags: ['Resources'],
                description: 'Execute sync process by syncer id.',
            },
        },
        async (request) => {
            await fastify.authenticate(request);
            fastify.requireScopes(request, [
                'syncer:write',
                'irrmanager:write',
                'irrobject:write',
            ]);

            const params = request.params as { id: string };
            const syncer = options.mitei.syncerList[params.id];
            if (!syncer) {
                throw new HttpError(404, 'NOT_FOUND', 'Syncer not found.');
            }

            await options.mitei.syncASSets(params.id);
            return { ok: true };
        },
    );

    fastify.get(
        '/irr/objects',
        {
            schema: {
                tags: ['Resources'],
                description: 'Read IRRManager and IRRTypes.Object records.',
            },
        },
        async (request) => {
            await fastify.authenticate(request);
            requireScopes(request.authContext, ['irrmanager:read']);

            const query = request.query as {
                name?: string;
                source?: string;
                type?: string;
                uuid?: string;
            };

            const selector = selectObjects(options.mitei, query);

            return selector.uuids
                .filter((uuid) => {
                    const object = selector.resultsMap[uuid];
                    const identifiers = [uuid, object.name];

                    const canReadObject = hasResourcePermission(
                        request.authContext,
                        'irrobject',
                        'read',
                        {
                            identifiers,
                            source: object.source,
                            type: object.type,
                        },
                    );

                    const canReadContent = hasResourcePermission(
                        request.authContext,
                        'irrcontent',
                        'read',
                        {
                            identifiers,
                            source: object.source,
                            type: object.type,
                        },
                    );

                    return canReadObject && canReadContent;
                })
                .map((uuid) => {
                    const object = selector.resultsMap[uuid];
                    return {
                        uuid,
                        name: object.name,
                        type: object.type,
                        source: object.source,
                        created: object.created,
                        last_modified: object.last_modified,
                        rpsl: object.toRPSL(),
                    };
                });
        },
    );

    fastify.post(
        '/irr/objects',
        {
            schema: {
                tags: ['Resources'],
                description: 'Create IRRTypes.Object in IRRManager from RPSL.',
                body: objectWriteBodySchema,
            },
        },
        async (request, reply) => {
            await fastify.authenticate(request);
            requireScopes(request.authContext, ['irrmanager:write']);

            const body = request.body as { rpsl: string };
            const object = ASSetObject.loadFromRPSL(body.rpsl);
            const identifiers = [object.name];

            requireResourcePermission(
                request.authContext,
                'irrobject',
                'write',
                {
                    identifiers,
                    source: object.source,
                    type: object.type,
                },
            );
            requireResourcePermission(
                request.authContext,
                'irrcontent',
                'write',
                {
                    identifiers,
                    source: object.source,
                    type: object.type,
                },
            );

            const uuid = options.mitei.IRRManager.register(object);

            reply.code(201);
            return { uuid, object };
        },
    );

    fastify.put(
        '/irr/objects/:uuid',
        {
            schema: {
                tags: ['Resources'],
                description: 'Replace IRRTypes.Object by UUID.',
                body: objectWriteBodySchema,
            },
        },
        async (request) => {
            await fastify.authenticate(request);
            requireScopes(request.authContext, ['irrmanager:write']);

            const params = request.params as { uuid: string };
            const body = request.body as { rpsl: string };

            const existed = options.mitei.IRRManager.registrations[params.uuid];
            if (!existed) {
                throw new HttpError(404, 'NOT_FOUND', 'IRR object not found.');
            }

            const targetIdentifiers = [params.uuid, existed.name];
            requireResourcePermission(
                request.authContext,
                'irrobject',
                'write',
                {
                    identifiers: targetIdentifiers,
                    source: existed.source,
                    type: existed.type,
                },
            );
            requireResourcePermission(
                request.authContext,
                'irrcontent',
                'write',
                {
                    identifiers: targetIdentifiers,
                    source: existed.source,
                    type: existed.type,
                },
            );

            const object = ASSetObject.loadFromRPSL(body.rpsl);
            options.mitei.IRRManager.replace(params.uuid, object);

            return {
                uuid: params.uuid,
                object,
            };
        },
    );

    fastify.delete(
        '/irr/objects/:uuid',
        {
            schema: {
                tags: ['Resources'],
                description: 'Delete IRRTypes.Object by UUID.',
            },
        },
        async (request, reply) => {
            await fastify.authenticate(request);
            requireScopes(request.authContext, ['irrmanager:write']);

            const params = request.params as { uuid: string };
            const existed = options.mitei.IRRManager.registrations[params.uuid];

            if (!existed) {
                throw new HttpError(404, 'NOT_FOUND', 'IRR object not found.');
            }

            const targetIdentifiers = [params.uuid, existed.name];
            requireResourcePermission(
                request.authContext,
                'irrobject',
                'write',
                {
                    identifiers: targetIdentifiers,
                    source: existed.source,
                    type: existed.type,
                },
            );

            options.mitei.IRRManager.delete(params.uuid);
            options.mitei.IRRManager.rebuildIndex();

            reply.code(204);
            return null;
        },
    );
}
