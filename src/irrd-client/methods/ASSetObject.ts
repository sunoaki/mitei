import type { ApolloClient } from "@apollo/client";
import { gql } from "@apollo/client/core";

import { IRRD as IRRDTypes } from "../types";
import { ASSetContent, ASSetMember, ASSetObject } from "../../core/IRR/AS_SET";
import * as tools from "../tools";

import getMntBy from "./MntBy";

export function parseAsnToken(token: string): string | null {
	const trimmed = token.trim();
	if (!trimmed) {
		return null;
	}
	// Preserve hierarchical member tokens like AS47778:AS-SUNOAKI as-is (uppercased).
	return trimmed.toUpperCase();
}

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

export default async function getASSetObject(
	client: ApolloClient,
	setName: string,
	options: IRRDTypes.Options.getASSet = {},
): Promise<ASSetObject[]> {
	let sources = tools.normalizeSourceArg(options.sources);

	const result = await client.query<IRRDTypes.Response.RecursiveSetMembers>({
		query: RECURSIVE_SET_MEMBERS_QUERY,
		variables: {
			setNames: [setName],
			depth: options.depth,
			sources: sources,
			excludeSets: options.excludeSets,
		},
	});

	const list = result.data?.recursiveSetMembers ?? [];
	if (list.length === 0) {
		throw new Error(`AS-SET not found: ${setName}`);
	}

	const results = await Promise.all(
		list.map(async (chosen) => {
			const source = tools.toIRRSource(chosen.rootSource);
			const members: ASSetMember[] = [];
			for (const token of chosen.members ?? []) {
				const parsed = parseAsnToken(token);
				if (!parsed) {
					continue;
				}
				try {
					// we cannot determine the source of members here, so we use "undetermined".
					members.push(new ASSetMember(parsed, "undetermined"));
				} catch {
					// Ignore any non-AS* tokens (e.g. prefixes from route-set resolution).
				}
			}

			const content = new ASSetContent(members);

			const mntBy = await getMntBy(client, setName, {
				sources: source,
				objectClass: ["as-set"],
				refSourceOverride: chosen.rootSource,
			});

			return new ASSetObject(setName, source, content, mntBy);
		}),
	);

	sources = sources ? sources : [];

	results.sort((a, b) => {
		// prefer preferred source first
		if (sources.indexOf(a.source) > sources.indexOf(b.source)) {
			return 1;
		}
		if (sources.indexOf(a.source) < sources.indexOf(b.source)) {
			return -1;
		}

		// then sort by source name
		return a.source.localeCompare(b.source);
	});

	return results;
}
