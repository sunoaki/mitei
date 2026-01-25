import { IRR } from "../types";

export namespace as_set {
    export interface Content extends IRR.Content {
        members: Member[];
    }
    
    export interface Object extends IRR.Object {
        type: IRR.Type.AS_SET;
        content: Content;
    }

    export interface Member extends IRR.mnter.reference {};
}