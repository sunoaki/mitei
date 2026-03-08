import { IRR } from '../types';
export default class IRRContent implements IRR.Content {
    public descriptions?: string[];
    public remarks?: string[];

    constructor() {
        this.descriptions = [];
        this.remarks = [];
    }

    /** Converts the content to RPSL format. */
    toRPSL(): string {
        let rpsl = '';

        if (this.descriptions) {
            rpsl += this.descriptions
                .map((desc) => `description: ${desc}\n`)
                .join('');
        }

        if (this.remarks) {
            rpsl += this.remarks
                .map((remark) => `remarks: ${remark}\n`)
                .join('');
        }

        return rpsl;
    }
}
