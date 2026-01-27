import type { ApolloClient } from "@apollo/client";
import { gql } from "@apollo/client/core";

import { IRR } from "../../core/IRR/types";
import { IRRD as IRRDTypes } from "../types";
import * as tools from "../tools";

const RPSL_OBJECTS_MNT_BY_QUERY = gql`
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

export default async function getMntBy(
	client: ApolloClient,
	rpslPk: string,
	options: IRRDTypes.Options.getMntBy = {},
): Promise<IRR.mnter.reference[]> {
	const sources = tools.normalizeSourceArg(options.sources);

	const result = await client.query<IRRDTypes.Response.RpslObjectsMntBy>({
		query: RPSL_OBJECTS_MNT_BY_QUERY,
		variables: {
			rpslPk: [rpslPk],
			sources,
			objectClass: options.objectClass,
		},
	});

	const objects = result.data?.rpslObjects ?? [];
	if (objects.length === 0) {
		return [];
	}

	const preferSources = sources?.map((s) => s.toUpperCase());
	const chosen =
		preferSources && preferSources.length > 0
			? objects.find((o) => o.source && preferSources.includes(o.source.toUpperCase())) ??
				objects[0]
			: objects[0];

	const refSource = (options.refSourceOverride
		? String(options.refSourceOverride)
		: chosen.source ?? undefined) as IRR.Source | undefined;

	return (chosen.mntBy ?? [])
		.filter((x): x is string => typeof x === "string" && x.length > 0)
		.map((name) => ({ name, source: refSource }));
}
