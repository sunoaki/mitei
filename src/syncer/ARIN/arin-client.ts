import type { IRR } from '../../core/IRR/types';
import type { ASSetObject } from '../../core/IRR/AS_SET/index';
import type { Syncer } from '../types';

import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

import { xmlToASSetObject, asSetObjectToXML } from './serialize/as-set';
import { resolveErrorMessage } from './serialize/error';

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    textNodeName: '#text',
    removeNSPrefix: true,
});

export const UserAgent = 'Mitei';

export class ARIN implements Syncer {
    readonly source: IRR.Source = 'ARIN';

    private token: string;
    public orgHandle: string;
    public baseURL = new URL('https://reg.arin.net/rest/');
    public userAgent = UserAgent;

    constructor(token: string, orgHandle: string) {
        this.token = token;
        this.orgHandle = orgHandle;
    }

    async queryASSet(asSet: string): Promise<ASSetObject> {
        // GET https://reg.arin.net/rest/irr/as-set/AS-EXAMPLE-ARIZ?apikey=API-1234-5678-2222-3333
        // Accept: application/xml

        const url = new URL(
            `irr/as-set/${asSet}?apikey=${this.token}`,
            this.baseURL,
        );
        const response = await axios.get(url.toString(), {
            headers: {
                'User-Agent': this.userAgent,
                Accept: 'application/xml',
            },
            validateStatus: () => true,
        });

        if (response.status !== 200) {
            const { errorCode, errorMessage } = resolveErrorMessage(
                response.data,
            );
            throw new Error(
                `Failed to query AS-SET. Status: ${response.status}, Code: ${errorCode}, Message: ${errorMessage}`,
            );
        }

        const xmlData = response.data;

        return xmlToASSetObject(xmlData);
    }

    async createASSet(asSet: ASSetObject): Promise<boolean> {
        // POST https://reg.arin.net/rest/irr/as-set?apikey=API-1234-5678-2222-3333&orgHandle=ORGHANDLE
        // Accept: application/xml
        // Content-Type: application/xml

        // The request body should contain the AS-SET data in XML format.
        // The response will indicate whether the creation was successful.

        const orgHandle = asSet.mnt_by[0].name;

        const url = new URL(
            `irr/as-set?apikey=${this.token}&orgHandle=${orgHandle}`,
            this.baseURL,
        );

        // Convert ASSetObject to XML format (you would need to implement this function)
        const xmlData = asSetObjectToXML(asSet);

        const response = await axios.post(url.toString(), xmlData, {
            headers: {
                'User-Agent': this.userAgent,
                'Content-Type': 'application/xml',
                Accept: 'application/xml',
            },
            validateStatus: () => true,
        });

        if (response.status !== 200) {
            const { errorCode, errorMessage } = resolveErrorMessage(
                response.data,
            );
            throw new Error(
                `Failed to create AS-SET. Status: ${response.status}, Code: ${errorCode}, Message: ${errorMessage}`,
            );
        }

        return response.status === 200; // HTTP 200 means successfully created.
    }

    async listASSets(
        OrgHandle: string = this.orgHandle,
    ): Promise<IRR.objectReference[]> {
        // GET https://reg.arin.net/rest/org/EXAMPLECORP/as-sets?apikey=API-1234-5678-2222-3333
        // Accept: application/xml
        // Content-Type: application/xml

        const url = new URL(
            `org/${OrgHandle}/as-sets?apikey=${this.token}`,
            this.baseURL,
        );

        const response = await axios.get(url.toString(), {
            headers: {
                'User-Agent': this.userAgent,
                Accept: 'application/xml',
            },
            validateStatus: () => true,
        });

        // <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        // <collection
        // xmlns="http://www.arin.net/regrws/core/v1"
        // xmlns:ns2="http://www.arin.net/regrws/messages/v1"
        // xmlns:ns3="http://www.arin.net/regrws/shared-ticket/v1"
        // xmlns:ns4="http://www.arin.net/regrws/ttl/v1"
        // xmlns:ns5="http://www.arin.net/regrws/rpki/v1">
        // 	<asSetRef name="AS-PHOENIX" entry="SIMPLE"/>
        // 	<asSetRef name="AS-MESA" entry="SIMPLE"/>
        // </collection>

        if (response.status !== 200) {
            const { errorCode, errorMessage } = resolveErrorMessage(
                response.data,
            );
            throw new Error(
                `Failed to list AS-SETs. Status: ${response.status}, Code: ${errorCode}, Message: ${errorMessage}`,
            );
        }

        const xmlData = parser.parse(response.data);

        const asSetRefs = xmlData.collection?.asSetRef;
        if (!asSetRefs) {
            return [];
        }

        const asSetList: IRR.objectReference[] = [];

        if (Array.isArray(asSetRefs)) {
            for (const ref of asSetRefs) {
                if (ref.name) {
                    asSetList.push({ name: ref.name });
                }
            }
        } else if (asSetRefs.name) {
            asSetList.push({ name: asSetRefs.name });
        }

        return asSetList;
    }

    async modifyASSet(asSet: ASSetObject): Promise<boolean> {
        // PUT https://reg.arin.net/rest/irr/as-set/AS-EXAMPLE-ARIZ?apikey=API-1234-5678-2222-3333
        // Accept: application/xml
        // Content-Type: application/xml

        const url = new URL(
            `irr/as-set/${asSet.name}?apikey=${this.token}`,
            this.baseURL,
        );

        const xmlData = asSetObjectToXML(asSet);

        const response = await axios.put(url.toString(), xmlData, {
            headers: {
                'User-Agent': this.userAgent,
                'Content-Type': 'application/xml',
                Accept: 'application/xml',
            },
            validateStatus: () => true,
        });

        if (response.status !== 200) {
            const { errorCode, errorMessage } = resolveErrorMessage(
                response.data,
            );
            throw new Error(
                `Failed to modify AS-SET. Status: ${response.status}, Code: ${errorCode}, Message: ${errorMessage}`,
            );
        }

        return response.status === 200; // HTTP 200 means successfully modified.
    }

    async deleteASSet(asSetName: string): Promise<boolean> {
        // DELETE https://reg.arin.net/rest/irr/as-set/AS-EXAMPLE-ARIZ?apikey=API-1234-5678-2222-3333
        // Accept: application/xml

        const url = new URL(
            `irr/as-set/${asSetName}?apikey=${this.token}`,
            this.baseURL,
        );

        const response = await axios.delete(url.toString(), {
            headers: {
                'User-Agent': this.userAgent,
                Accept: 'application/xml',
            },
            validateStatus: () => true,
        });

        if (response.status !== 200) {
            const { errorCode, errorMessage } = resolveErrorMessage(
                response.data,
            );
            throw new Error(
                `Failed to delete AS-SET. Status: ${response.status}, Code: ${errorCode}, Message: ${errorMessage}`,
            );
        }

        return response.status === 200; // HTTP 200 means successfully deleted.
    }
}

export default ARIN;
