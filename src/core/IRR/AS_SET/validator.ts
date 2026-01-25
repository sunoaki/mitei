export function isValidASSETName(name: string): boolean {
	if (name.startsWith("AS-") && name.length > 3) {
		return true;
	}

	return false;
}

export function isValidASNName(name: string): boolean {
	if (name.startsWith("AS") && name.length > 2) {
		const asnPart = name.slice(2);
		const asnNumber = parseInt(asnPart, 10);
		return !isNaN(asnNumber) && asnNumber >= 0 && asnNumber <= 4294967295;
	}

	return false;
}
