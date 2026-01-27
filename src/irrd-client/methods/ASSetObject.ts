import { IRRD as IRRDTypes } from "../types";
import { ASSetContent, ASSetMember, ASSetObject } from "../../core/IRR/AS_SET";
import * as tools from "../tools";

import type { ApolloClient } from "@apollo/client";

type RpslObjectsMntByResponse = {
	rpslObjects: Array<{
		rpslPk?: string | null;
		source?: string | null;
		mntBy?: string[] | null;
	}>;
};

export function parseAsnToken(token: string): string | null {
	const trimmed = token.trim();
	if (!trimmed) {
		return null;
	}
	// Preserve hierarchical member tokens like AS47778:AS-SUNOAKI as-is (uppercased).
	return trimmed.toUpperCase();
}

export default async function getASSetObject(
	client: ApolloClient,
	setName: string,
	options: IRRDTypes.Options.getASSet = {},
): Promise<ASSetObject[]> {
	let sources = tools.normalizeSourceArg(options.sources);

	const result = await client.query<IRRDTypes.Response.RecursiveSetMembers>({
		query: tools.RECURSIVE_SET_MEMBERS_QUERY,
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

			// Fill mnt-by from the AS-SET object itself.
			const mntByResult = await client.query<RpslObjectsMntByResponse>({
				query: tools.RPSL_OBJECTS_MNT_BY_QUERY,
				variables: {
					rpslPk: [setName],
					sources: sources,
					objectClass: ["as-set"],
				},
			});

			const mntBy = (mntByResult.data?.rpslObjects?.[0]?.mntBy ?? [])
				.filter((x): x is string => typeof x === "string" && x.length > 0)
				.map((name) => ({ name, source: chosen.rootSource }));

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
