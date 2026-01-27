import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client/core";

import { IRRD as IRRDTypes } from "./types";

import getASSetObject from "./methods/ASSetObject";

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
	 * Fetch an AS-SET's member ASNs from IRRd, and return a core ASSetObject.
	 *
	 * Uses IRRd's specialised `recursiveSetMembers` query for performance.
	 */
	public async getASSetObject(
		setName: string,
		options: IRRDTypes.Options.getASSet = {},
	) {
		return getASSetObject(this.client, setName, options);
	}
}
