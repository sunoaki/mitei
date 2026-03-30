import whoisServer from '.';
import IRRManager from '../../core/IRR/manager/manager';
import { readFileSync } from 'node:fs';

const irrManager = new IRRManager();
const file = new URL('./test.db.json', import.meta.url);

irrManager.load(JSON.parse(readFileSync(file).toString()));

const server = new whoisServer(irrManager.selector);
server.banner.push('% Welcome to the Mitei Whois Server');

server.listen(8043);
console.log('Whois server is running on port 8043');
