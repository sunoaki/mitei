import whoisServer from '.';

import IRRManager from '../../core/IRR/manager/manager';
import { IRR as IRRTypes } from '../../core/IRR/types';
import * as asSet from '../../core/IRR/AS_SET/index';

const irrManager = new IRRManager();

const asSetObject = new asSet.ASSetObject(
    'AS-EXAMPLE',
    'RADB' as IRRTypes.Source,
    new asSet.ASSetContent([
        new asSet.ASSetMember('AS65001', 'RIPE' as IRRTypes.Source),
        new asSet.ASSetMember('AS65002', 'ARIN' as IRRTypes.Source),
    ]),
);

const asSetObject2 = new asSet.ASSetObject(
    'AS-EXAMPLE',
    'ARIN' as IRRTypes.Source,
    new asSet.ASSetContent([
        new asSet.ASSetMember('AS65001', 'RIPE' as IRRTypes.Source),
        new asSet.ASSetMember('AS65002', 'ARIN' as IRRTypes.Source),
    ]),
);

irrManager.register(asSetObject);
irrManager.register(asSetObject2);

const server = new whoisServer(irrManager.selector);
server.banner.push('% Welcome to the Mitei Whois Server');

server.listen(8043);
console.log('Whois server is running on port 8043');
