import type {
    ResourceAction,
    ResourceName,
    RoleName,
    Scope,
} from './permissions';

export interface TokenPrincipal {
    issuer: string;
    subject: string;
    scopes: string[];
    tokenType: 'jwt' | 'opaque' | 'dev';
    rawClaims: Record<string, unknown>;
}

export interface UserScopeOverride {
    grant: Scope[];
    deny: Scope[];
}

export interface ResourcePermissionRule {
    resource: ResourceName;
    action: ResourceAction;
    objectPattern: string;
    sourcePattern?: string;
    typePattern?: string;
}

export interface UserRecord {
    id: string;
    issuer: string;
    subject: string;
    displayName: string;
    email?: string;
    enabled: boolean;
    roles: RoleName[];
    scopes: UserScopeOverride;
    resourceRules: ResourcePermissionRule[];
    createdAt: string;
    updatedAt: string;
}

export interface EffectiveAuthContext {
    principal: TokenPrincipal;
    user: UserRecord;
    tokenScopes: Set<Scope>;
    effectiveScopes: Set<Scope>;
}
