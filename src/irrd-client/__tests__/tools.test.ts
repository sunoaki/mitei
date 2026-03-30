import { IRR } from '../../core/IRR/types';
import { normalizeSourceArg, toIRRSource } from '../tools';

describe('irrd-client tools', () => {
    test('toIRRSource returns undetermined when value is missing', () => {
        expect(toIRRSource(undefined)).toBe(IRR.Source.undetermined);
    });

    test('toIRRSource uppercases provided value', () => {
        expect(toIRRSource('ripe')).toBe('RIPE');
    });

    test('normalizeSourceArg handles undefined/string/array', () => {
        expect(normalizeSourceArg(undefined)).toBeUndefined();
        expect(normalizeSourceArg('radb')).toEqual(['RADB']);
        expect(normalizeSourceArg(['ripe', 'arin'])).toEqual(['RIPE', 'ARIN']);
    });
});
