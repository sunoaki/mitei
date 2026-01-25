import { IRR } from "..";

/** Checks if a value is a valid IRR.Source */
export function inSource(value: any) {
	return Object.values(IRR.Source).includes(value);
}

/** Error thrown when an invalid RPSL name is provided. */
export const INVALID_RPSL_NAME = new Error(`Invalid RPSL name provided.`);

export function isNumeric(value: string) {
	return !isNaN(parseFloat(value)) && isFinite(parseFloat(value));
}

/** Checks if a value is a valid RPSL name */
export function isRPSLName(value: string): boolean {
	const rpslNameRegex = /^[A-Z0-9\-\_\.]+$/;
	if (!rpslNameRegex.test(value)) return false;
	if (isNumeric(value[0])) return false;
	return true;
}
