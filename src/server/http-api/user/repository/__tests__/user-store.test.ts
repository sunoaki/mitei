import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { UserStore } from '../user-store';

describe('http-api user store', () => {
    test('supports create, update, role assignment and delete', async () => {
        const dir = await mkdtemp(join(tmpdir(), 'mitei-user-store-'));
        const filePath = join(dir, 'users.json');
        const store = new UserStore(filePath);

        const created = await store.create({
            issuer: 'https://issuer.example',
            subject: 'alice',
            displayName: 'Alice',
            roles: ['viewer'],
        });

        expect(created.id).toBeTruthy();

        const updated = await store.update(created.id, {
            displayName: 'Alice Updated',
        });

        expect(updated.displayName).toBe('Alice Updated');

        const roleUpdated = await store.setRoles(created.id, ['admin']);
        expect(roleUpdated.roles).toEqual(['admin']);

        const enabledUpdated = await store.setEnabled(created.id, false);
        expect(enabledUpdated.enabled).toBe(false);

        await store.remove(created.id);
        const afterDelete = await store.getById(created.id);
        expect(afterDelete).toBeUndefined();

        await rm(dir, { recursive: true, force: true });
    });
});
