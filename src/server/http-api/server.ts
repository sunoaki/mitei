import { resolve } from 'node:path';
import type { FastifyInstance } from 'fastify';
import Mitei from '../../core';
import { isHttpError } from './auth/errors';
import { loadAuthConfigFromEnv } from './auth/config';
import { createTokenVerifier } from './auth/token-verifier';
import { registerAuthPlugin } from './auth/plugin';
import { registerUserRoutes } from './user';
import { registerResourceRoutes } from './resources';
import { UserStore } from './user/repository/user-store';
import { ensureInternalWhoisUser } from '../whois/auth';

async function bootstrapAdminUser(userStore: UserStore): Promise<void> {
    const bootstrapIssuer = process.env.MITEI_BOOTSTRAP_ISSUER?.trim();
    const bootstrapSubject = process.env.MITEI_BOOTSTRAP_SUBJECT?.trim();

    if (!bootstrapIssuer || !bootstrapSubject) {
        return;
    }

    const existed = await userStore.getByExternalIdentity(
        bootstrapIssuer,
        bootstrapSubject,
    );

    if (existed) {
        return;
    }

    await userStore.create({
        issuer: bootstrapIssuer,
        subject: bootstrapSubject,
        displayName:
            process.env.MITEI_BOOTSTRAP_DISPLAY_NAME?.trim() ||
            'bootstrap-admin',
        email: process.env.MITEI_BOOTSTRAP_EMAIL?.trim(),
        roles: ['admin'],
        resourceRules: [
            {
                resource: 'irrobject',
                action: 'read',
                objectPattern: '*',
            },
            {
                resource: 'irrobject',
                action: 'write',
                objectPattern: '*',
            },
            {
                resource: 'irrcontent',
                action: 'read',
                objectPattern: '*',
            },
            {
                resource: 'irrcontent',
                action: 'write',
                objectPattern: '*',
            },
        ],
    });
}

async function startServer(
    fastify: FastifyInstance,
    _options: Record<string, unknown>,
) {
    const mitei = new Mitei();
    const authConfig = loadAuthConfigFromEnv();
    const tokenVerifier = createTokenVerifier(authConfig);
    const userStore = new UserStore(
        process.env.MITEI_USER_STORE_FILE?.trim() ||
            resolve(process.cwd(), 'data/http-api-users.json'),
    );

    await bootstrapAdminUser(userStore);
    await ensureInternalWhoisUser(userStore);

    await registerAuthPlugin(fastify, {
        tokenVerifier,
        userStore,
    });

    fastify.setErrorHandler(async (error, _request, reply) => {
        if (isHttpError(error)) {
            reply.code(error.statusCode).send({
                error: error.code,
                message: error.message,
            });
            return;
        }

        const message =
            error instanceof Error ? error.message : 'Unexpected error';

        reply.code(500).send({
            error: 'INTERNAL_SERVER_ERROR',
            message,
        });
    });

    fastify.get(
        '/ping',
        {
            schema: {
                tags: ['Health Check'],
                description:
                    'A simple endpoint to check if the server is running.',
                response: {
                    200: {
                        description: 'Successful response',
                        type: 'object',
                        properties: {
                            pong: {
                                type: 'string',
                                example: 'pong',
                            },
                        },
                    },
                },
            },
        },
        async () => {
            return { pong: 'pong' };
        },
    );

    await fastify.register(
        async (scopedFastify) => {
            await registerUserRoutes(scopedFastify, {
                userStore,
            });
            await registerResourceRoutes(scopedFastify, {
                mitei,
            });
        },
        { prefix: '/api/v1' },
    );
}

export default startServer;
