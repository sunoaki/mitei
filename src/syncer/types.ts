import type { IRR } from '../core/IRR/types';

export interface Syncer {
    source: IRR.Source;
    queryASSet(asSetName: string): Promise<IRR.TypeMap[IRR.Type.AS_SET]>;
    createASSet(asSet: IRR.TypeMap[IRR.Type.AS_SET]): Promise<boolean>;
    modifyASSet(asSet: IRR.TypeMap[IRR.Type.AS_SET]): Promise<boolean>;
    deleteASSet(asSetName: string): Promise<boolean>;
    listASSets(mnt_by?: string): Promise<IRR.objectReference[]>;
}
