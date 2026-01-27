import type { FetchPolicy } from "@apollo/client/core";
import { IRR } from "../core/IRR/types";

export namespace IRRD {
	export namespace Response {
		export type RecursiveSetMembers = {
			recursiveSetMembers: Array<{
				rpslPk: string;
				rootSource: string;
				members: string[] | null;
			}>;
		};
	}

	export namespace Options {
		export interface client {
			endpoint: string;
			headers?: Record<string, string>;
			fetch?: typeof fetch;
			fetchPolicy?: FetchPolicy;
		}

		export interface getASSet {
			/** Optional filter for the AS-SET source (e.g. "RIPE", "RADB", "NTTCOM"). */
			sources?: IRR.Source | IRR.Source[] | string | string[];

			/**
			 * Max recursion depth for member resolution.
			 * Default: 0 (IRRd default). Use >0 if your instance requires it.
			 */
			depth?: number;

			/** Exclude these sets during recursion. */
			excludeSets?: string[];
		}
	}
}
