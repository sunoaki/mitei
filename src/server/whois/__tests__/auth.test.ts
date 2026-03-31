import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { UserStore } from '../../http-api/user/repository/user-store';
import {
    ensureInternalWhoisUser,
    WHOIS_INTERNAL_USER,
    getInternalWhoisAuthContext,
} from '../auth';

describe('whois internal auth user', () => {
    test('bootstraps default internal whois user with readonly irrobject rule', async () => {
        const dir = await mkdtemp(join(tmpdir(), 'mitei-whois-user-'));
        const filePath = join(dir, 'users.json');
        const store = new UserStore(filePath);

        await ensureInternalWhoisUser(store);

        const user = await store.getByExternalIdentity(
            WHOIS_INTERNAL_USER.issuer,
            WHOIS_INTERNAL_USER.subject,
        );

        expect(user).toBeDefined();
        expect(user?.displayName).toBe('mitei-internal-whois');
        expect(user?.resourceRules).toEqual([
            {
                resource: 'irrobject',
                action: 'read',
                objectPattern: '*@*',
            },
        ]);

        const context = await getInternalWhoisAuthContext(store);
        expect(context.user.displayName).toBe('mitei-internal-whois');
        expect(context.effectiveScopes.has('irrobject:read')).toBe(true);

        await rm(dir, { recursive: true, force: true });
    });
});
