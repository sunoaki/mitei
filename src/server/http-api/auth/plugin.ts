import type { FastifyInstance, FastifyRequest } from 'fastify';
import { HttpError } from './errors';
import type { EffectiveAuthContext } from './types';
import { buildAuthContext, requireScopes } from './authorization';
import type { Scope } from './permissions';
import type { UserStore } from '../user/repository/user-store';
import type { TokenVerifier } from './token-verifier';

interface AuthPluginOptions {
    tokenVerifier: TokenVerifier;
    userStore: UserStore;
}

declare module 'fastify' {
    interface FastifyRequest {
        authContext?: EffectiveAuthContext;
    }

    interface FastifyInstance {
        authenticate(request: FastifyRequest): Promise<void>;
        requireScopes(request: FastifyRequest, scopes: Scope[]): void;
    }
}

export async function registerAuthPlugin(
    fastify: FastifyInstance,
    options: AuthPluginOptions,
): Promise<void> {
    fastify.decorate(
        'authenticate',
        async function authenticate(request: FastifyRequest): Promise<void> {
            const principal =
                await options.tokenVerifier.verifyAuthorizationHeader(
                    request.headers.authorization,
                );

            const user = await options.userStore.getByExternalIdentity(
                principal.issuer,
                principal.subject,
            );

            if (!user) {
                throw new HttpError(
                    403,
                    'FORBIDDEN',
                    'User is not registered in mitei.',
                );
            }

            if (!user.enabled) {
                throw new HttpError(403, 'FORBIDDEN', 'User is disabled.');
            }

            request.authContext = buildAuthContext(principal, user);
        },
    );

    fastify.decorate(
        'requireScopes',
        function requireScopesOnRequest(
            request: FastifyRequest,
            scopes: Scope[],
        ): void {
            requireScopes(request.authContext, scopes);
        },
    );
}
