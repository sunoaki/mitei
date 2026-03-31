import whoisServer from '.';
import IRRManager from '../../core/IRR/manager/manager';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { UserStore } from '../http-api/user/repository/user-store';
import { ensureInternalWhoisUser, getInternalWhoisAuthContext } from './auth';

const irrManager = new IRRManager();
const file = new URL('./test.db.json', import.meta.url);

irrManager.load(JSON.parse(readFileSync(file).toString()));

const userStore = new UserStore(
    process.env.MITEI_USER_STORE_FILE?.trim() ||
        resolve(process.cwd(), 'data/http-api-users.json'),
);
await ensureInternalWhoisUser(userStore);

const server = new whoisServer(irrManager.selector, {
    getAuthContext: async () => getInternalWhoisAuthContext(userStore),
});
server.banner.push('% Welcome to the Mitei Whois Server');

server.listen(8043);
console.log('Whois server is running on port 8043');
