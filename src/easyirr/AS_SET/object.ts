import type { as_set } from "src/core/IRR/AS_SET/types";
import { ASSetContent, ASSetObject } from "src/core/IRR/AS_SET";

import { easy_as_set } from "./types";
import { v4 as uuidv4 } from "uuid";

export class EasyASSetObject extends ASSetObject implements easy_as_set.Object {
	private readonly uuid = uuidv4;

	patchList: as_set.Patch[] = [];

	easyContents: {
		[contentUUID: string]: {
			content: easy_as_set.Content;
			contentName: string;
			lastRefreshed: Date | null;
			lastApplied: Date | null;
			lastContent: as_set.Content | null;
		};
	} = {};

	/** Return the UUID of the eayirr content */
	register(content: easy_as_set.Content): string {
		const contentUUID = this.uuid();

		this.easyContents[contentUUID] = {
			content: content,
			contentName: content.contentName,
			lastRefreshed: null,
			lastApplied: null,
			lastContent: null,
		};

		return contentUUID;
	}

	/** Delete the easy irr content by its UUID */
	unregister(contentUUID: string): void {
		delete this.easyContents[contentUUID];
	}

	clean() {
		this.easyContents = {};
		this.patchList = [];
		this.content = new ASSetContent();
	}

	/** Refresh the content by generate a patch from newer context to older, need  */
	makePatch(contentUUID: string): as_set.Patch {
		const registered = this.easyContents[contentUUID];
		if (!registered) {
			throw new Error(`Content UUID ${contentUUID} not registered.`);
		}

		const newContent = registered.content.toASSetContent();
		registered.lastRefreshed = new Date();

		const patch = this.content.diff(newContent);
		this.patchList.push(patch);

		registered.lastContent = newContent;

		return patch;
	}

	applyPatches(): void {
		for (const patch of this.patchList) {
			this.content = this.content.patch(patch);
		}

		this.patchList = [];
	}

	refreshAll(): void {
		for (const contentUUID of Object.keys(this.easyContents)) {
			this.makePatch(contentUUID);
		}

		this.applyPatches();
	}
}
