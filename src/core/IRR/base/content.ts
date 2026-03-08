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

    static loadFromRPSL(rpsl: string): IRRContent {
        const content = new IRRContent();
        const lines = rpsl.split('\n');
        for (const line of lines) {
            const [key, ...rest] = line.split(':');
            const value = rest.join(':').trim();

            if (key === 'description') {
                if (!content.descriptions) content.descriptions = [];
                content.descriptions.push(value);
            } else if (key === 'remarks') {
                if (!content.remarks) content.remarks = [];
                content.remarks.push(value);
            }
        }

        return content;
    }
}
