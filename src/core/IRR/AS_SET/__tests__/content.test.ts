import { IRR } from '../../types';
import { ASSetContent, ASSetMember } from '../index';

describe('ASSetContent', () => {
    test('supports add, delete, has, diff and patch operations', () => {
        const content = new ASSetContent();

        content.add(new ASSetMember('AS12345', IRR.Source.RADB, ['Initial member']));
        content.add(new ASSetMember('AS67890', IRR.Source.RIPE, ['Second member']));

        expect(content.has(new ASSetMember('AS67890', IRR.Source.RIPE))).toBe(true);

        const deleted = content.delete(new ASSetMember('AS12345', IRR.Source.RADB));
        expect(deleted).toBe(true);
        expect(content.members).toHaveLength(1);

        const other = new ASSetContent([
            new ASSetMember('AS67890', IRR.Source.RIPE),
            new ASSetMember('AS54321', IRR.Source.APNIC),
        ]);

        expect(content.isEqual(other)).toBe(false);

        const diff = content.diff(other);
        expect(diff.added).toEqual([new ASSetMember('AS54321', IRR.Source.APNIC)]);
        expect(diff.removed).toEqual([]);

        const patched = content.patch(diff);
        expect(patched.isEqual(other)).toBe(true);
    });

    test('supports union and can round-trip from RPSL', () => {
        const left = new ASSetContent([
            new ASSetMember('AS67890', IRR.Source.RIPE),
        ]);
        const right = new ASSetContent([
            new ASSetMember('AS67890', IRR.Source.RIPE),
            new ASSetMember('AS99999', IRR.Source.ARIN, ['Union member']),
        ]);

        const union = left.union(right);
        union.descriptions = ['Union of two AS_SET contents'];
        union.remarks = ['Top-level remark'];

        expect(union.members).toHaveLength(2);
        expect(union.has(new ASSetMember('AS99999', IRR.Source.ARIN))).toBe(true);

        const rpsl = union.toRPSL();
        const loaded = ASSetContent.loadFromRPSL(rpsl);

        expect(loaded.isEqual(union)).toBe(true);
        expect(loaded.members.find((m) => m.name === 'AS99999')?.remarks).toEqual([
            'Union member',
        ]);
    });
});
