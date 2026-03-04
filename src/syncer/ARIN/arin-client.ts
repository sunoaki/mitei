import type { ASSetObject } from "../../core/IRR/AS_SET/index";

import axios from "axios";
import { xmlToASSetObject, asSetObjectToXML } from "./serialize/as-set";

export const UserAgent = "Mitei";

export class ARIN {
	private token: string;
	public orgHandle: string;
	public baseURL = new URL("https://reg.arin.net/rest/irr/");
	public userAgent = UserAgent;

	constructor(token: string, orgHandle: string) {
		this.token = token;
		this.orgHandle = orgHandle;
	}

	async queryASSet(asSet: string): Promise<ASSetObject> {
		// GET https://reg.arin.net/rest/irr/as-set/AS-EXAMPLE-ARIZ?apikey=API-1234-5678-2222-3333
		// Accept: application/xml

		const url = new URL(`as-set/${asSet}?apikey=${this.token}`, this.baseURL);
		const response = await axios.get(url.toString(), {
			headers: {
				"User-Agent": this.userAgent,
				Accept: "application/xml",
			},
		});

		const xmlData = response.data;

		return xmlToASSetObject(xmlData);
	}

	async createASSet(asSet: ASSetObject): Promise<boolean> {
		// POST https://reg.arin.net/rest/irr/as-set?apikey=API-1234-5678-2222-3333&orgHandle=ORGHANDLE

		// The request body should contain the AS-SET data in XML format.
		// The response will indicate whether the creation was successful.

		// This is a placeholder implementation. You would need to convert the ASSetObject to XML format and send it in the request body.

		const setName = asSet.name;
		const orgHandle = asSet.mnt_by[0].name; // Assuming mnt_by contains the organization handle

		const url = new URL(
			`as-set?apikey=${this.token}&orgHandle=${orgHandle}`,
			this.baseURL,
		);

		// Convert ASSetObject to XML format (you would need to implement this function)
		const xmlData = asSetObjectToXML(asSet);

		const response = await axios.post(url.toString(), xmlData, {
			headers: {
				"User-Agent": this.userAgent,
				"Content-Type": "application/xml",
				Accept: "application/xml",
			},
		});

		return response.status === 200; // HTTP 200 means successfully created.
	}
}

export default ARIN;
