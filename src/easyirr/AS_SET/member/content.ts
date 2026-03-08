import { easy_as_set } from '../types';
import { ASSetContent } from 'src/core/IRR/AS_SET';

export class Content implements easy_as_set.Content {
    type: 'Content' = 'Content';

    contentName: string;

    members: easy_as_set.Member[];

    constructor(contentName: string, members: easy_as_set.Member[]) {
        this.contentName = contentName;
        this.members = members;
    }

    async toASSetContent(): Promise<ASSetContent> {
        let content = new ASSetContent();

        for (const member of this.members) {
            const memberContent = await member.toASSetContent();
            content = content.union(memberContent);
        }

        return content;
    }
}
