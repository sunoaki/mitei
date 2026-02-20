export function isValidASSETName(name: string): boolean {

	name = name.split(":").length > 1 ? name.split(":").slice(-1)[0] : name;

	if (name.startsWith("AS-") && name.length > 3) {
		return true;
	}

	return false;
}

/**
 * AS-SET members can be ASNs, AS-SET names, or hierarchical combinations (e.g. AS47778:AS-SUNOAKI).
 */
export function isValidASSetMemberName(name: string): boolean {
	const parts = name.split(":").filter((p) => p.length > 0);
	if (parts.length === 0) {
		return false;
	}
	return parts.every((p) => isValidASNName(p) || isValidASSETName(p));
}

export function isValidASNName(name: string): boolean {
	if (name.startsWith("AS") && name.length > 2) {
		const asnPart = name.slice(2);
		const asnNumber = parseInt(asnPart, 10);
		return !isNaN(asnNumber) && asnNumber >= 0 && asnNumber <= 4294967295;
	}

	return false;
}
