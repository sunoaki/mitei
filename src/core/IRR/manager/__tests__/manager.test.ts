import { IRR as IRRTypes } from '../../types';
import { ASSetContent, ASSetMember, ASSetObject } from '../../AS_SET/index';
import IRRManager from '../manager';

describe('IRR manager', () => {
    const createASSetObject = () =>
        new ASSetObject(
            'AS-EXAMPLE',
            IRRTypes.Source.RADB,
            new ASSetContent([
                new ASSetMember('AS65001', IRRTypes.Source.RIPE),
                new ASSetMember('AS65002', IRRTypes.Source.ARIN),
            ]),
        );

    test('supports register/query/delete lifecycle', () => {
        const irr = new IRRManager();
        const uuid = irr.register(createASSetObject());

        const selector = irr.selector;
        expect(selector.selectByName('AS-EXAMPLE').results).toHaveLength(1);
        expect(
            selector.reset().selectBySource(IRRTypes.Source.RADB).results,
        ).toHaveLength(1);
        expect(
            selector.reset().selectByType(IRRTypes.Type.AS_SET).results,
        ).toHaveLength(1);

        irr.delete(uuid);
        irr.rebuildIndex();

        expect(
            selector.reset().selectByType(IRRTypes.Type.AS_SET).results,
        ).toHaveLength(0);
    });

    test('can export and load registrations', () => {
        const irr = new IRRManager();
        const uuid = irr.register(createASSetObject());

        const exportedData = irr.export();
        expect(exportedData[uuid]).toContain('as-set: as-example');

        const loaded = new IRRManager();
        loaded.load(exportedData);

        const results = loaded.selector.selectByName('AS-EXAMPLE').results;
        expect(results).toHaveLength(1);
        expect(results[0].toRPSL()).toContain('source: RADB');
    });
});
