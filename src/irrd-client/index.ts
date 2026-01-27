import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client/core";

import { IRRD as IRRDTypes } from "./types";

import getASSetObject from "./methods/ASSetObject";
import getMntBy from "./methods/MntBy";

export default class IRRD {
	private readonly client: ApolloClient;

	constructor(options: IRRDTypes.Options.client) {
		const fetchImpl = options.fetch ?? globalThis.fetch;
		if (!fetchImpl) {
			throw new Error(
				"IRRD client requires fetch. Use Node.js >= 18 or pass { fetch } in IRRDClientOptions.",
			);
		}

		this.client = new ApolloClient({
			link: new HttpLink({
				uri: options.endpoint,
				fetch: fetchImpl,
				headers: options.headers,
			}),
			cache: new InMemoryCache(),
			defaultOptions: {
				query: {
					fetchPolicy: options.fetchPolicy ?? "no-cache",
				},
			},
		});
	}

	/**
	 * Fetch an AS-SET's member ASNs from IRRd, and return a list of ASSetObject.
	 *
	 * Uses IRRd's specialised `recursiveSetMembers` query for performance.
	 */
	public async getASSetObject(
		setName: string,
		options: IRRDTypes.Options.getASSet = {},
	) {
		return getASSetObject(this.client, setName, options);
	}

	/**
	 * Query `mntBy` for a specific RPSL object and return IRR-style references.
     * 
     * Uses the `rpslObjects` query.
	 */
	public async getMntBy(
		rpslPk: string,
		options?: Parameters<typeof getMntBy>[2],
	) {
		return getMntBy(this.client, rpslPk, options);
	}
}
