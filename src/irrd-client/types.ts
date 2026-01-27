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

		export type RpslObjectsMntBy = {
			rpslObjects: Array<{
				rpslPk?: string | null;
				source?: string | null;
				mntBy?: string[] | null;
			}>;
		};
	}

	export namespace Options {
		export type Source = IRR.Source | IRR.Source[] | string | string[];
		export interface client {
			endpoint: string;
			headers?: Record<string, string>;
			fetch?: typeof fetch;
			fetchPolicy?: FetchPolicy;
		}

		export interface getASSet {
			/** Optional filter for the AS-SET source (e.g. "RIPE", "RADB", "NTTCOM"). */
			sources?: Source;

			/**
			 * Max recursion depth for member resolution.
			 * Default: 0 (IRRd default). Use >0 if your instance requires it.
			 */
			depth?: number;

			/** Exclude these sets during recursion. */
			excludeSets?: string[];
		}

		export interface getMntBy {
			/** Restrict lookup to these IRRd sources. */
			sources?: Source;

			/** Optional objectClass filter (e.g. ["as-set"]). */
			objectClass?: string[];

			/** If set, force the `source` field on returned references to this value. */
			refSourceOverride?: IRR.Source | string;
		}
	}
}
