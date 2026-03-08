import type { easy_as_set } from '../types';
import { as_set } from 'src/core/IRR/AS_SET/types';
import { ASSetContent, ASSetMember } from 'src/core/IRR/AS_SET';
import { IRR } from 'src/core/IRR/types';
import IRRDClient from 'src/irrd-client/index';

export interface ASSetMemberOptions {
    /** RPSL name for the AS-SET */
    setName: string;

    /** Whether to flatten the AS-SET */
    flatten: boolean;

    /** Sources of the AS-SET information, both first query & flatten query, Used for IRRD. */
    sources?: IRR.Source[];

    /** Only valid when flatten is true, Use -1 for unlimited depth */
    depth?: number;

    /** Excluded members from the AS-SET */
    exclude?: easy_as_set.Member[];

    /** IRRD Server GraphQL URL */
    irrdGraphQLEndpoint?: string;

    /** Remarks for the AS-SET member */
    remarks?: string[];
}

export class AS_SET_Member implements easy_as_set.AS_SET_Member {
    type = 'AS_SET' as const;

    setName: string;
    flatten: boolean;
    sources?: IRR.Source[];

    depth?: number;
    exclude?: easy_as_set.Member[];
    remarks?: string[];
    irrdGraphQLEndpoint?: string;

    constructor(options: ASSetMemberOptions) {
        this.setName = options.setName;
        this.sources = options.sources;
        this.flatten = options.flatten;
        this.depth = options.depth;
        this.exclude = options.exclude;
        this.remarks = options.remarks;
        this.irrdGraphQLEndpoint = options.irrdGraphQLEndpoint;
    }

    async toASSetContent(): Promise<as_set.Content> {
        if (!this.flatten) {
            return this.toStaticASSetContent();
        }

        const flattenedContent = await this.toFlattenedASSetContent();
        const excludeContents = await this.getExcludeContent();

        // Apply excludes to the flattened content
        for (const excludeContent of excludeContents) {
            for (const member of excludeContent.members) {
                flattenedContent.delete(member);
            }
        }

        return flattenedContent;
    }

    toStaticASSetContent(): as_set.Content {
        const member = new ASSetMember(
            this.setName,
            this.sources ? this.sources[0] : undefined,
            this.remarks,
        );
        const content = new ASSetContent([member]);
        return content;
    }

    async toFlattenedASSetContent(): Promise<as_set.Content> {
        const IRRDClientInstance = new IRRDClient({
            endpoint: this.irrdGraphQLEndpoint ?? 'https://rr.ntt.net/graphql',
        });

        const searchedASSetObjects = await IRRDClientInstance.getASSetObject(
            this.setName,
            {
                sources: this.sources ?? undefined, // If source is undefined, it will search in all sources
                depth: this.depth ?? -1, // Use -1 to indicate "no limit" if depth is not specified
            },
        );

        if (searchedASSetObjects.length === 0) {
            throw new Error(
                `AS-SET ${this.setName} not found in sources ${this.sources}.`,
            );
        }

        const selectedASSetObject = searchedASSetObjects[0]; // For simplicity, we take the first result.

        return selectedASSetObject.content;
    }

    async getExcludeContent(): Promise<as_set.Content[]> {
        if (!this.exclude) {
            return [];
        }

        const contents: as_set.Content[] = [];
        for (const member of this.exclude) {
            const content = await member.toASSetContent();
            contents.push(content);
        }
        return contents;
    }
}
