import {
    buildAuthContext,
    hasResourcePermission,
    listKnownScopes,
    normalizeRoles,
    requireResourcePermission as requireResourcePermissionCore,
    requireScopes as requireScopesCore,
    resolveEffectiveScopes,
    type ResourceMatchTarget,
} from '../../../access-control/authorization';
import { AccessControlError } from '../../../access-control/errors';
import type {
    EffectiveAuthContext,
    TokenPrincipal,
    UserRecord,
} from '../../../access-control/types';
import type {
    ResourceAction,
    ResourceName,
    RoleName,
    Scope,
} from '../../../access-control/permissions';
import { HttpError } from './errors';

function mapAccessControlError(error: unknown): never {
    if (!(error instanceof AccessControlError)) {
        throw error;
    }

    if (error.code === 'UNAUTHORIZED') {
        throw new HttpError(401, error.code, error.message);
    }

    throw new HttpError(403, error.code, error.message);
}

export {
    buildAuthContext,
    hasResourcePermission,
    listKnownScopes,
    normalizeRoles,
    resolveEffectiveScopes,
};

export type {
    EffectiveAuthContext,
    TokenPrincipal,
    UserRecord,
    ResourceAction,
    ResourceName,
    RoleName,
    Scope,
    ResourceMatchTarget,
};

export function requireScopes(
    context: EffectiveAuthContext | undefined,
    requiredScopes: Scope[],
): void {
    try {
        requireScopesCore(context, requiredScopes);
    } catch (error) {
        mapAccessControlError(error);
    }
}

export function requireResourcePermission(
    context: EffectiveAuthContext | undefined,
    resource: ResourceName,
    action: ResourceAction,
    target: ResourceMatchTarget,
): void {
    try {
        requireResourcePermissionCore(context, resource, action, target);
    } catch (error) {
        mapAccessControlError(error);
    }
}
