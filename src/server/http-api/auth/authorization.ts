import { HttpError } from './errors';
import {
    allScopes,
    asScope,
    roleScopeMap,
    type ResourceAction,
    type ResourceName,
    type RoleName,
    type Scope,
} from './permissions';
import type { EffectiveAuthContext, TokenPrincipal, UserRecord } from './types';

export function resolveEffectiveScopes(user: UserRecord): Set<Scope> {
    const scopes = new Set<Scope>();

    for (const role of user.roles) {
        for (const scope of roleScopeMap[role]) {
            scopes.add(scope);
        }
    }

    for (const scope of user.scopes.grant) {
        scopes.add(scope);
    }

    for (const scope of user.scopes.deny) {
        scopes.delete(scope);
    }

    return scopes;
}

function normalizeTokenScopes(tokenScopes: string[]): Set<Scope> {
    const normalized = new Set<Scope>();
    for (const scope of tokenScopes) {
        const knownScope = asScope(scope);
        if (knownScope) {
            normalized.add(knownScope);
        }
    }
    return normalized;
}

function intersectScopes(a: Set<Scope>, b: Set<Scope>): Set<Scope> {
    const intersection = new Set<Scope>();
    for (const item of a) {
        if (b.has(item)) {
            intersection.add(item);
        }
    }
    return intersection;
}

export function buildAuthContext(
    principal: TokenPrincipal,
    user: UserRecord,
): EffectiveAuthContext {
    const localScopes = resolveEffectiveScopes(user);
    const tokenScopes = normalizeTokenScopes(principal.scopes);

    const effectiveScopes =
        tokenScopes.size > 0
            ? intersectScopes(localScopes, tokenScopes)
            : localScopes;

    return {
        principal,
        user,
        tokenScopes,
        effectiveScopes,
    };
}

export function requireScopes(
    context: EffectiveAuthContext | undefined,
    requiredScopes: Scope[],
): void {
    if (!context) {
        throw new HttpError(
            401,
            'UNAUTHORIZED',
            'Authentication context is missing.',
        );
    }

    const missingScopes = requiredScopes.filter(
        (scope) => !context.effectiveScopes.has(scope),
    );

    if (missingScopes.length > 0) {
        throw new HttpError(
            403,
            'FORBIDDEN',
            `Missing required scopes: ${missingScopes.join(', ')}`,
        );
    }
}

export function listKnownScopes(): Scope[] {
    return [...allScopes];
}

export function normalizeRoles(roles: string[]): RoleName[] {
    const resolvedRoles: RoleName[] = [];

    for (const role of roles) {
        if (role in roleScopeMap) {
            resolvedRoles.push(role as RoleName);
        }
    }

    return resolvedRoles;
}

function escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function globToRegex(pattern: string): RegExp {
    const normalized = pattern.trim();
    const regexBody = escapeRegex(normalized)
        .replace(/\\\*/g, '.*')
        .replace(/\\\?/g, '.');

    return new RegExp(`^${regexBody}$`, 'i');
}

function hasBaseResourceScope(
    context: EffectiveAuthContext,
    resource: ResourceName,
    action: ResourceAction,
): boolean {
    return context.effectiveScopes.has(`${resource}:${action}` as Scope);
}

function hasAnyResourceScope(
    context: EffectiveAuthContext,
    resource: ResourceName,
    action: ResourceAction,
): boolean {
    return context.effectiveScopes.has(`${resource}:${action}:any` as Scope);
}

export interface ResourceMatchTarget {
    identifiers: string[];
    source?: string;
    type?: string;
}

export function hasResourcePermission(
    context: EffectiveAuthContext | undefined,
    resource: ResourceName,
    action: ResourceAction,
    target: ResourceMatchTarget,
): boolean {
    if (!context) return false;

    if (hasAnyResourceScope(context, resource, action)) {
        return true;
    }

    if (!hasBaseResourceScope(context, resource, action)) {
        return false;
    }

    const identifiers = target.identifiers
        .map((id) => id.trim())
        .filter((id) => id.length > 0);

    if (identifiers.length === 0) {
        return false;
    }

    return context.user.resourceRules.some((rule) => {
        if (rule.resource !== resource || rule.action !== action) {
            return false;
        }

        const objectRegex = globToRegex(rule.objectPattern);
        const objectMatched = identifiers.some((identifier) =>
            objectRegex.test(identifier),
        );

        if (!objectMatched) {
            return false;
        }

        if (rule.sourcePattern) {
            if (!target.source) {
                return false;
            }

            const sourceRegex = globToRegex(rule.sourcePattern);
            if (!sourceRegex.test(target.source)) {
                return false;
            }
        }

        if (rule.typePattern) {
            if (!target.type) {
                return false;
            }

            const typeRegex = globToRegex(rule.typePattern);
            if (!typeRegex.test(target.type)) {
                return false;
            }
        }

        return true;
    });
}

export function requireResourcePermission(
    context: EffectiveAuthContext | undefined,
    resource: ResourceName,
    action: ResourceAction,
    target: ResourceMatchTarget,
): void {
    if (!context) {
        throw new HttpError(
            401,
            'UNAUTHORIZED',
            'Authentication context is missing.',
        );
    }

    const allowed = hasResourcePermission(context, resource, action, target);

    if (!allowed) {
        throw new HttpError(
            403,
            'FORBIDDEN',
            `Missing resource permission: ${resource}:${action} for [${target.identifiers.join(', ')}]`,
        );
    }
}
