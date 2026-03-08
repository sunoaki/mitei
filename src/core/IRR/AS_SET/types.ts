import { IRR } from '../types';

export interface ASSetPatch {
    added: ASSetMember[];
    removed: ASSetMember[];
}
export interface ASSetContent extends IRR.Content {
    members: ASSetMember[];

    index(member: ASSetMember): number;
    has(member: ASSetMember): boolean;
    add(member: ASSetMember): void;
    delete(member: ASSetMember): boolean;

    isEqual(other: ASSetContent): boolean;
    diff(other: ASSetContent): ASSetPatch;
    patch(patch: ASSetPatch): ASSetContent;

    union(other: ASSetContent): ASSetContent;
}

export interface ASSetObject extends IRR.Object {
    type: IRR.Type.AS_SET;
    content: ASSetContent;
}

export interface ASSetMember extends IRR.mnter.reference {}
export namespace as_set {
    export type Object = ASSetObject;
    export type Content = ASSetContent;
    export type Member = ASSetMember;
    export type Patch = ASSetPatch;
}
