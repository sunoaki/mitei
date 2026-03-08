import IRRD from '.';

const client = new IRRD({ endpoint: 'https://rr.ntt.net/graphql' });

const A = await client.getASSetObject('AS-NET186', { depth: 1 });

A.forEach((i) => console.log(i));
