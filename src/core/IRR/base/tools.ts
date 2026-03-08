import { IRR } from '../types';

/** Checks if a value is a valid IRR.Source */
export function inSource(value: any) {
    if (typeof value !== 'string') {
        return false;
    }

    // Accept any non-empty token-like source. IRRd sources are instance-defined.
    // Keep existing behaviour for internal placeholders.
    if (value === IRR.Source.internal || value === IRR.Source.undetermined) {
        return true;
    }

    // Typical IRR source names are uppercase and consist of letters/digits/-/_/.
    // We intentionally keep this permissive to allow custom sources like NTTCOM.
    return /^[A-Z0-9][A-Z0-9_\-]{0,31}$/.test(value.toUpperCase());
}

/** Error thrown when an invalid RPSL name is provided. */
export const INVALID_RPSL_NAME = new Error(`Invalid RPSL name provided.`);

export function isNumeric(value: string) {
    return !isNaN(parseFloat(value)) && isFinite(parseFloat(value));
}

/** Checks if a value is a valid RPSL name */
export function isRPSLName(value: string): boolean {
    // Allow ':' for hierarchical set names (e.g. AS47778:AS-SUNOAKI)
    const rpslNameRegex = /^[A-Za-z0-9\-\_\.:]+$/;
    if (!rpslNameRegex.test(value)) return false;
    if (isNumeric(value[0])) return false;
    return true;
}
