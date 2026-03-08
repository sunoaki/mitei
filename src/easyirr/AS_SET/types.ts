import { as_set } from 'src/core/IRR/AS_SET/types';
import { IRR } from 'src/core/IRR/types';

export namespace easy_as_set {
    export interface Member {
        type: 'AS_NUMBER' | 'AS_SET' | 'Content';

        remarks?: string[];
        toASSetContent(): as_set.Content | Promise<as_set.Content>;
    }

    export interface ASN_Member extends Member {
        type: 'AS_NUMBER';

        /** AS Number */
        asn: number;
    }

    export interface AS_SET_Member extends Member {
        type: 'AS_SET';
        /** RPSL name for the AS-SET */
        setName: string;

        /** Whether to flatten the AS-SET */
        flatten: boolean;

        /** Sources of the AS-SET information, both first query & flatten query, Used for IRRD. */
        sources?: IRR.Source[];

        /** Only valid when flatten is true, Use -1 for unlimited depth */
        depth?: number;

        /** Excluded members from the AS-SET */
        exclude?: Member[];

        /** IRRD Server GraphQL URL */
        irrdGraphQLEndpoint?: string;
    }

    export interface Content extends Member {
        type: 'Content';

        /** Name of the content, use for linked content. */
        contentName: string;

        members: Member[];
    }

    export interface Object extends as_set.Object {
        patchList: as_set.Patch[];

        easyContents: {
            [contentUUID: string]: {
                content: easy_as_set.Content;
                contentName: string;
                lastRefreshed: Date | null;
                lastApplied: Date | null;
                lastContent: as_set.Content | null;
            };
        };

        register(content: Content): string;
        unregister(contentUUID: string): void;

        makePatch(contentUUID: string): Promise<as_set.Patch>;
        applyPatches(): void;

        refreshAll(): Promise<void>;

        clean(): void;
    }

    export namespace contentConf {
        /**
         * Member in string need be a RPSL-valid name,
         * number need be a valid ASN,
         * complexMember need be an object with type and corresponding properties.
         */
        export type contextMember = string | number | complexMember;

        export type complexMember =
            | asnMember
            | omittedASNMember
            | asSetMember
            | omittedASSetMember;

        export interface ASNMemberOptions {
            remarks?: string | string[];
        }

        export interface omittedASNMember {
            [ASN: string]: ASNMemberOptions;
        }
        export interface asnMember extends ASNMemberOptions {
            type: 'ASN';
            value: number;
        }

        export interface asSetMemberOptions {
            flatten: boolean;
            depth?: number;
            sources?: IRR.Source[] | IRR.Source;
            exclude?: contextMember[];
            irrdGraphQLEndpoint?: string;
            remarks?: string | string[];
        }

        export interface omittedASSetMember {
            [setName: string]: asSetMemberOptions;
        }

        export interface asSetMember extends asSetMemberOptions {
            type: 'AS-SET';
            value: string;
        }

        export interface context {
            name: string;

            members: contextMember[];
        }
    }
}

export default easy_as_set;
