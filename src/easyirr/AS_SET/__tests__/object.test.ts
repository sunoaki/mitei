import { EasyASSetObject as ASSetObject } from '../object';
import { ASN_Member } from '../member/asn';
import { AS_SET_Member } from '../member/as_set';
import { Content } from '../member/content';

describe('easy AS-SET object', () => {
    test('registers content and applies generated patch', async () => {
        const content = new Content('test-content', [
            new ASN_Member(47778),
            new ASN_Member(65002, ['typed member']),
            new AS_SET_Member({
                setName: 'AS-SECOND',
                flatten: false,
            }),
        ]);
        const object = new ASSetObject('AS-EXAMPLE', 'internal');

        const contentUUID = object.register(content);

        const patch = await object.makePatch(contentUUID);
        expect(patch.added.length).toBeGreaterThan(0);

        object.applyPatches();

        expect(object.patchList).toHaveLength(0);
        expect(object.content.has(47778)).toBe(true);
        expect(object.content.has(65002)).toBe(true);
        expect(object.content.has(65003)).toBe(false);
        expect(object.toRPSL()).toContain('as-set: as-example');
    });
});
