import { IRRD } from './types';
import { IRR } from '../core/IRR/types';

export function toIRRSource(value: string | undefined): IRR.Source {
    if (!value) {
        return IRR.Source.undetermined;
    }
    return value.toUpperCase() as IRR.Source;
}

export function normalizeSourceArg(
    source?: IRRD.Options.Source,
): string[] | undefined {
    if (!source) {
        return undefined;
    }
    if (typeof source === 'string') {
        return [source.toUpperCase()];
    }
    return source.map((s) => s.toUpperCase());
}
