import { buildAuthContext } from '../http-api/auth/authorization';
import type { EffectiveAuthContext } from '../http-api/auth/types';
import type { UserStore } from '../http-api/user/repository/user-store';

export const WHOIS_INTERNAL_USER = {
    issuer: 'mitei-internal',
    subject: 'mitei-internal-whois',
    displayName: 'mitei-internal-whois',
} as const;

export async function ensureInternalWhoisUser(
    userStore: UserStore,
): Promise<void> {
    const existed = await userStore.getByExternalIdentity(
        WHOIS_INTERNAL_USER.issuer,
        WHOIS_INTERNAL_USER.subject,
    );

    if (existed) {
        return;
    }

    await userStore.create({
        issuer: WHOIS_INTERNAL_USER.issuer,
        subject: WHOIS_INTERNAL_USER.subject,
        displayName: WHOIS_INTERNAL_USER.displayName,
        roles: ['viewer'],
        resourceRules: [
            {
                resource: 'irrobject',
                action: 'read',
                objectPattern: '*@*',
            },
        ],
    });
}

export async function getInternalWhoisAuthContext(
    userStore: UserStore,
): Promise<EffectiveAuthContext> {
    const user = await userStore.getByExternalIdentity(
        WHOIS_INTERNAL_USER.issuer,
        WHOIS_INTERNAL_USER.subject,
    );

    if (!user) {
        throw new Error(
            'Internal whois user is not initialized in user store.',
        );
    }

    if (!user.enabled) {
        throw new Error('Internal whois user is disabled.');
    }

    return buildAuthContext(
        {
            issuer: WHOIS_INTERNAL_USER.issuer,
            subject: WHOIS_INTERNAL_USER.subject,
            scopes: [],
            tokenType: 'dev',
            rawClaims: {
                service: 'whois',
            },
        },
        user,
    );
}
