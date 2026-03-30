import IRRD from '.';

const client = new IRRD({ endpoint: 'https://rr.ntt.net/graphql' });

const records = await client.getASSetObject('AS-NET186', { depth: 1 });
records.forEach((record) => console.log(record));
