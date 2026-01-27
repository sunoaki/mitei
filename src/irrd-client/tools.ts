import { IRR } from "../core/IRR/types";

import { gql } from "@apollo/client/core";

export const RECURSIVE_SET_MEMBERS_QUERY = gql`
	query RecursiveSetMembers(
		$setNames: [String!]!
		$depth: Int
		$sources: [String!]
		$excludeSets: [String!]
	) {
		recursiveSetMembers(
			setNames: $setNames
			depth: $depth
			sources: $sources
			excludeSets: $excludeSets
		) {
			rpslPk
			rootSource
			members
		}
	}
`;

export const RPSL_OBJECTS_MNT_BY_QUERY = gql`
	query RpslObjectsMntBy(
		$rpslPk: [String!]
		$sources: [String!]
		$objectClass: [String!]
	) {
		rpslObjects(rpslPk: $rpslPk, sources: $sources, objectClass: $objectClass) {
			rpslPk
			source
			mntBy
		}
	}
`;

export function toIRRSource(value: string | undefined): IRR.Source {
	if (!value) {
		return IRR.Source.undetermined;
	}
	return value.toUpperCase() as IRR.Source;
}

export function normalizeSourceArg(
	source?: IRR.Source | IRR.Source[] | string | string[],
): string[] | undefined {
	if (!source) {
		return undefined;
	}
	if (typeof source === "string") {
		return [source.toUpperCase()];
	}
	return source.map((s) => s.toUpperCase());
}
