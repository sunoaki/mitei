import Type from 'typebox';

export const allScopes = [
    'syncer:read',
    'syncer:write',
    'irrmanager:read',
    'irrmanager:write',
    'irrobject:read',
    'irrobject:write',
    'irrobject:read:any',
    'irrobject:write:any',
    'irrcontent:read',
    'irrcontent:write',
    'irrcontent:read:any',
    'irrcontent:write:any',
    'users:read',
    'users:write',
    'users:manage',
] as const;

export type Scope = (typeof allScopes)[number];

export const roleNames = ['viewer', 'operator', 'admin'] as const;
export type RoleName = (typeof roleNames)[number];

export const roleScopeMap: Record<RoleName, Scope[]> = {
    viewer: [
        'syncer:read',
        'irrmanager:read',
        'irrobject:read',
        'irrcontent:read',
    ],
    operator: [
        'syncer:read',
        'syncer:write',
        'irrmanager:read',
        'irrmanager:write',
        'irrobject:read',
        'irrobject:write',
        'irrcontent:read',
        'irrcontent:write',
    ],
    admin: [...allScopes],
};

export const resourceNames = ['irrobject', 'irrcontent'] as const;
export type ResourceName = (typeof resourceNames)[number];

export const resourceActions = ['read', 'write'] as const;
export type ResourceAction = (typeof resourceActions)[number];

export const roleSchema = Type.Union(
    roleNames.map((role) => Type.Literal(role)),
);

export const scopeSchema = Type.Union(
    allScopes.map((scope) => Type.Literal(scope)),
);

export function asScope(scope: string): Scope | undefined {
    return allScopes.find((knownScope) => knownScope === scope);
}

export function asRole(role: string): RoleName | undefined {
    return roleNames.find((knownRole) => knownRole === role);
}
