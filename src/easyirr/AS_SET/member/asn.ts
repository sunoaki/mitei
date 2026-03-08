import { easy_as_set } from '../types';
import { as_set } from 'src/core/IRR/AS_SET/types';
import { ASSetContent, ASSetMember } from 'src/core/IRR/AS_SET';

export class ASN_Member implements easy_as_set.ASN_Member {
    type = 'AS_NUMBER' as const;

    asn: number;
    remarks?: string[];

    constructor(asn: number, remarks?: string[]) {
        this.asn = asn;
        this.remarks = remarks;
    }

    toASSetContent(): as_set.Content {
        const member = new ASSetMember(
            `AS${this.asn}`,
            'undetermined',
            this.remarks,
        );
        const content = new ASSetContent([member]);
        return content;
    }
}
