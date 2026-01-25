import { IRR } from "..";

export namespace as_set {
    interface content extends IRR.Content {
        members: IRR.recordReference[];
    }
    
    interface record extends IRR.Record {
        type: IRR.Type.AS_SET;
        content: content;
    }
}