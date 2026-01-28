import { IRR } from "../types";

export namespace as_set {
	export interface Content extends IRR.Content {
		members: Member[];

        has(member: Member): boolean;
        add(member: Member): void;
        delete(member: Member): boolean;

        isEqual(other: Content): boolean;
        diff(other: Content): Patch;
        patch(patch: Patch): Content;

        union(other: Content): Content;
	}

	export interface Object extends IRR.Object {
		type: IRR.Type.AS_SET;
		content: Content;
	}

	export interface Patch {
		added: Member[];
		removed: Member[];
	}

	export interface Member extends IRR.mnter.reference {}
}
