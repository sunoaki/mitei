import { IRR } from '../../types';
import { ASSetContent, ASSetMember, ASSetObject } from '../index';

describe('ASSetObject', () => {
    test('serializes and loads from RPSL while preserving content', () => {
        const content = new ASSetContent([
            new ASSetMember('AS67890', IRR.Source.RIPE),
            new ASSetMember('AS99999', IRR.Source.ARIN, [
                'Added to union AS_SET',
            ]),
        ]);

        const object = new ASSetObject('AS-EXAMPLE', IRR.Source.RADB, content, [
            {
                name: 'MAINT-ASSET',
                source: IRR.Source.RADB,
                remarks: ['Maintainer for AS-EXAMPLE'],
            },
        ]);

        const loaded = ASSetObject.loadFromRPSL(object.toRPSL());

        expect(loaded.name).toBe('as-example');
        expect(loaded.source).toBe(IRR.Source.RADB);
        expect(loaded.content.isEqual(object.content)).toBe(true);
        expect(loaded.mnt_by[0]).toMatchObject({
            name: 'MAINT-ASSET',
            source: IRR.Source.RADB,
            remarks: ['Maintainer for AS-EXAMPLE'],
        });
    });
});
