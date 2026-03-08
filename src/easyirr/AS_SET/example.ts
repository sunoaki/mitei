import * as easy_as_set from './index';

const MainASSet = new easy_as_set.ASSetObject('AS-EXAMPLE', 'INTERNAL');

const mainContent = new easy_as_set.Content('SUNOAKI', [
    new easy_as_set.AS_SET_Member({
        setName: 'AS-SUNOAKI',
        flatten: true,
        sources: ['ARIN'],
        depth: 2,
        exclude: [new easy_as_set.ASN_Member(47778, ['Exclude ASN 47778'])],
    }),
]);

const sunoaki = MainASSet.register(mainContent);

console.log('Registered Content UUID:', sunoaki);

await MainASSet.makePatch(sunoaki);
console.log('Generated Patch:', MainASSet.patchList);
MainASSet.applyPatches();

console.log('AS-EXAMPLE after applying patches:');
console.log(MainASSet.toRPSL());

console.log('AS-EXAMPLE have AS47778? ', MainASSet.content.has(47778));
