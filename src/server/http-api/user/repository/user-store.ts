import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import type { RoleName, Scope } from '../../auth/permissions';
import type { ResourcePermissionRule, UserRecord } from '../../auth/types';

interface UserFileData {
    users: UserRecord[];
}

const defaultUserFileData: UserFileData = { users: [] };

function nowISO(): string {
    return new Date().toISOString();
}

export interface CreateUserInput {
    issuer: string;
    subject: string;
    displayName: string;
    email?: string;
    roles?: RoleName[];
    grantScopes?: Scope[];
    denyScopes?: Scope[];
    resourceRules?: ResourcePermissionRule[];
    enabled?: boolean;
}

export interface UpdateUserInput {
    displayName?: string;
    email?: string;
    grantScopes?: Scope[];
    denyScopes?: Scope[];
    resourceRules?: ResourcePermissionRule[];
}

export class UserStore {
    private readonly filePath: string;
    private loaded = false;
    private data: UserFileData = { ...defaultUserFileData };
    private writeChain: Promise<void> = Promise.resolve();

    constructor(filePath: string) {
        this.filePath = filePath;
    }

    private async ensureLoaded(): Promise<void> {
        if (this.loaded) return;

        try {
            const fileText = await readFile(this.filePath, 'utf8');
            const parsed = JSON.parse(fileText) as Partial<UserFileData>;
            this.data = {
                users: Array.isArray(parsed.users)
                    ? parsed.users.map((user) => ({
                          ...user,
                          resourceRules: Array.isArray(user.resourceRules)
                              ? user.resourceRules
                              : [],
                      }))
                    : [],
            };
        } catch {
            this.data = { ...defaultUserFileData };
            await this.flush();
        }

        this.loaded = true;
    }

    private async flush(): Promise<void> {
        await mkdir(dirname(this.filePath), { recursive: true });

        const tmpFilePath = `${this.filePath}.tmp`;
        await writeFile(
            tmpFilePath,
            JSON.stringify(this.data, null, 2),
            'utf8',
        );
        await rename(tmpFilePath, this.filePath);
    }

    private enqueueWrite(writeOperation: () => Promise<void>): Promise<void> {
        this.writeChain = this.writeChain.then(writeOperation);
        return this.writeChain;
    }

    async list(): Promise<UserRecord[]> {
        await this.ensureLoaded();
        return [...this.data.users];
    }

    async getById(id: string): Promise<UserRecord | undefined> {
        await this.ensureLoaded();
        return this.data.users.find((user) => user.id === id);
    }

    async getByExternalIdentity(
        issuer: string,
        subject: string,
    ): Promise<UserRecord | undefined> {
        await this.ensureLoaded();
        return this.data.users.find(
            (user) => user.issuer === issuer && user.subject === subject,
        );
    }

    async create(input: CreateUserInput): Promise<UserRecord> {
        await this.ensureLoaded();

        const existed = await this.getByExternalIdentity(
            input.issuer,
            input.subject,
        );
        if (existed) {
            throw new Error(
                'User with the same issuer and subject already exists.',
            );
        }

        const timestamp = nowISO();
        const newUser: UserRecord = {
            id: uuidv4(),
            issuer: input.issuer,
            subject: input.subject,
            displayName: input.displayName,
            email: input.email,
            enabled: input.enabled ?? true,
            roles: input.roles ?? ['viewer'],
            scopes: {
                grant: input.grantScopes ?? [],
                deny: input.denyScopes ?? [],
            },
            resourceRules: input.resourceRules ?? [],
            createdAt: timestamp,
            updatedAt: timestamp,
        };

        await this.enqueueWrite(async () => {
            this.data.users.push(newUser);
            await this.flush();
        });

        return newUser;
    }

    async update(id: string, input: UpdateUserInput): Promise<UserRecord> {
        await this.ensureLoaded();

        const user = this.data.users.find((item) => item.id === id);
        if (!user) {
            throw new Error('User not found.');
        }

        const updated: UserRecord = {
            ...user,
            displayName: input.displayName ?? user.displayName,
            email: input.email ?? user.email,
            scopes: {
                grant: input.grantScopes ?? user.scopes.grant,
                deny: input.denyScopes ?? user.scopes.deny,
            },
            resourceRules: input.resourceRules ?? user.resourceRules,
            updatedAt: nowISO(),
        };

        await this.enqueueWrite(async () => {
            const index = this.data.users.findIndex((item) => item.id === id);
            this.data.users[index] = updated;
            await this.flush();
        });

        return updated;
    }

    async setEnabled(id: string, enabled: boolean): Promise<UserRecord> {
        await this.ensureLoaded();

        const user = this.data.users.find((item) => item.id === id);
        if (!user) {
            throw new Error('User not found.');
        }

        const updated: UserRecord = {
            ...user,
            enabled,
            updatedAt: nowISO(),
        };

        await this.enqueueWrite(async () => {
            const index = this.data.users.findIndex((item) => item.id === id);
            this.data.users[index] = updated;
            await this.flush();
        });

        return updated;
    }

    async setRoles(id: string, roles: RoleName[]): Promise<UserRecord> {
        await this.ensureLoaded();

        const user = this.data.users.find((item) => item.id === id);
        if (!user) {
            throw new Error('User not found.');
        }

        const updated: UserRecord = {
            ...user,
            roles,
            updatedAt: nowISO(),
        };

        await this.enqueueWrite(async () => {
            const index = this.data.users.findIndex((item) => item.id === id);
            this.data.users[index] = updated;
            await this.flush();
        });

        return updated;
    }

    async remove(id: string): Promise<void> {
        await this.ensureLoaded();

        await this.enqueueWrite(async () => {
            this.data.users = this.data.users.filter((user) => user.id !== id);
            await this.flush();
        });
    }
}
