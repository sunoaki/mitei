import * as asSet from '../AS_SET/index';
import IRR from './manager';
import { IRR as IRRTypes } from '../types';

const irr = new IRR();

// Create AS_SET object
const asSetObject = new asSet.ASSetObject(
    'AS-EXAMPLE',
    'RADB' as IRRTypes.Source,
    new asSet.ASSetContent([
        new asSet.ASSetMember('AS65001', 'RIPE' as IRRTypes.Source),
        new asSet.ASSetMember('AS65002', 'ARIN' as IRRTypes.Source),
    ]),
);

const asSetUUID = irr.register(asSetObject);

console.log('Registered AS_SET with UUID:', asSetUUID);

// Use selector to find the AS_SET by name
const selector = irr.selector;
let results = selector.selectByName('AS-EXAMPLE').results;

console.log('Selector results for AS-EXAMPLE:', results[0].toRPSL());

results = selector.reset().selectBySource('RADB' as IRRTypes.Source).results;

console.log('Selector results for RADB:', results[0].toRPSL());

results = selector.reset().selectByType(IRRTypes.Type.AS_SET).results;

console.log('Selector results for Type@AS_SET:', results[0].toRPSL());

// Delete the AS_SET object
irr.delete(asSetUUID);
console.log('Deleted AS_SET with UUID:', asSetUUID);

results = selector.reset().selectByType(IRRTypes.Type.AS_SET).results;

console.log('Selector results after deletion (should be empty):', results);
