export namespace IRR {
	export enum Type {
		IP4 = "IP4",
		IP6 = "IP6",
		ROUTE4 = "ROUTE4",
		ROUTE6 = "ROUTE6",
		ROUTE_SET = "ROUTE_SET",
		ASN = "ASN",
		AS_SET = "AS_SET",
	}

	export enum Source {
		ARIN = "ARIN",
		RIPE = "RIPE",
		APNIC = "APNIC",
		LACNIC = "LACNIC",
		AFRINIC = "AFRINIC",
		RADB = "RADB",
		ALTDB = "ALTDB",

		// Only used when source is not
		undetermined = "undetermined",
		// Only used when as a placeholder for internal records.
		internal = "internal",
	}

	export interface objectReference {
		name: string;
		source?: Source;
		remarks?: string[]; // Optional remarks for the reference, will show in RPSL when possible.
	}

	export interface Content {
		descriptions?: string[]; // Multiple description lines are possible.
		remarks?: string[];

		toRPSL(): string;
	}

	export interface Object {
		name: string;
		type: Type;
		source: Source;
		content: Content;
		mnt_by: mnter.reference[]; // Only references, we don't store full mntner objects here.

		toRPSL(): string;
	}

	export namespace mnter {
		export interface reference extends objectReference {}
	}
}
