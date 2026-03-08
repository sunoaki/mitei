import { ASSetObject } from './AS_SET/types';
export namespace IRR {
    export enum Type {
        // IP4 = "IP4",
        // IP6 = "IP6",
        // ROUTE4 = "ROUTE4",
        // ROUTE6 = "ROUTE6",
        // ROUTE_SET = "ROUTE_SET",
        // ASN = "aut-num",
        AS_SET = 'as-set',
    }

    export type TypeMap = {
        [Type.AS_SET]: ASSetObject;
    };

    /**
     * IRR sources are instance-defined strings (e.g. RIPE, RADB, NTTCOM).
     *
     * We keep a value object so existing code can continue to use `IRR.Source.RIPE`,
     * while the `IRR.Source` *type* is extensible to support unknown sources.
     */
    export const Source = {
        // Copy from rr.ntt.net and common IRR sources
        NTTCOM: 'NTTCOM',
        LACNIC: 'LACNIC',
        IDNIC: 'IDNIC',
        RADB: 'RADB',
        RIPE: 'RIPE',
        'RIPE-NONAUTH': 'RIPE-NONAUTH',
        ALTDB: 'ALTDB',
        BELL: 'BELL',
        LEVEL3: 'LEVEL3',
        APNIC: 'APNIC',
        JPIRR: 'JPIRR',
        ARIN: 'ARIN',
        BBOI: 'BBOI',
        TC: 'TC',
        AFRINIC: 'AFRINIC',
        RPKI: 'RPKI',
        REGISTROBR: 'REGISTROBR',

        // Used when the upstream source string is missing/empty.
        undetermined: 'undetermined',
        // Used as a placeholder for internal records.
        internal: 'internal',
    } as const;

    /** Extensible source type: known sources + any custom instance source string. */
    export type Source = (typeof Source)[keyof typeof Source] | (string & {});

    export interface objectReference {
        name: string;
        source?: Source;
        remarks?: string[]; // Optional remarks for the reference, will show in RPSL when possible.
    }

    export interface Content {
        descriptions?: string[]; // Multiple description lines are possible.
        remarks?: string[];

        toRPSL(): string;
    }

    export interface Object {
        name: string;
        type: Type;
        source: Source;
        content: Content;
        mnt_by: mnter.reference[]; // Only references, we don't store full mntner objects here.
        contact: contact.reference[]; // Only references, we don't store full contact objects here.
        created: Date;
        last_modified: Date;

        toRPSL(): string;
    }

    export namespace mnter {
        export interface reference extends objectReference {}
    }

    export namespace contact {
        export interface reference extends objectReference {
            type:
                | 'admin-c'
                | 'tech-c'
                | 'zone-c'
                | 'abuse-c'
                | 'routing-c'
                | string; // Some IRR sources use custom contact types, so we allow any string here.
        }
    }
}
