import { easy_as_set } from '../types';
import { ASSetContent } from 'src/core/IRR/AS_SET';

export class Content implements easy_as_set.Content {
	type: "Content" = "Content";

	contentName: string;

	members: easy_as_set.Member[];

	constructor(contentName: string, members: easy_as_set.Member[]) {
		this.contentName = contentName;
		this.members = members;
	}

	toASSetContent(): ASSetContent {
		const content = new ASSetContent();

		for (const member of this.members) {
			content.union(member.toASSetContent());
		}

		return content;
	}
}