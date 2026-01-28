import { as_set } from "src/core/IRR/AS_SET/types";
import { IRR } from "src/core/IRR/types";

export namespace easy_as_set {
	interface Member {
		type: "AS_NUMBER" | "AS_SET" | "Content";

		remarks?: string[];
		toASSetContent(): as_set.Content;
	}

	export interface ASN_Member extends Member {
		type: "AS_NUMBER";

		/** AS Number */
		asn: number;
	}

	export interface AS_SET_Member extends Member {
		type: "AS_SET";
        /** RPSL name for the AS-SET */
		setName: string;

        /** Source of the AS-SET information, both first query & flatten query, Used for IRRD. */
		source: IRR.Source;

        /** Whether to flatten the AS-SET */
		flatten: boolean;

		/** Only valid when flatten is true, Use -1 for unlimited depth */
		depth?: number;

        /** Excluded members from the AS-SET */
		exclude?: Member[];
	}

	export interface Content {
		type: "Content";

        /** Name of the content, use for linked content. */
		contentName: string;

        members: Member[];
	}

    export interface Object extends as_set.Object {
        easyirr: {
            registeredContents: {
                content: Content;
                contentName: string;
                contentUUID: string;
                lastRefreshed: Date | null;
            }[];

            register(content: Content): string;
            unregister(contentUUID: string): void;

            refresh(contentUUID: string): void;
            refreshAll(): void;

            clean(): void;
        }
    }
}
