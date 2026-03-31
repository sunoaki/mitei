export interface AuthConfig {
    mode: 'enforce' | 'disabled';
    issuer: string;
    audience?: string;
    jwksUri?: string;
    introspectionEndpoint?: string;
    clientId?: string;
    clientSecret?: string;
}

export type {
    TokenPrincipal,
    UserScopeOverride,
    ResourcePermissionRule,
    UserRecord,
    EffectiveAuthContext,
} from '../../../access-control/types';
