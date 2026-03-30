import axios from 'axios';
import { ASSetContent, ASSetMember, ASSetObject } from 'src/core/IRR/AS_SET';
import { IRR } from 'src/core/IRR/types';
import ARIN from '../arin-client';
import { asSetObjectToXML, xmlToASSetObject } from '../serialize/as-set';
import { resolveErrorMessage } from '../serialize/error';

jest.mock('axios', () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
    },
}));

jest.mock('../serialize/as-set', () => ({
    __esModule: true,
    xmlToASSetObject: jest.fn(),
    asSetObjectToXML: jest.fn(),
}));

jest.mock('../serialize/error', () => ({
    __esModule: true,
    resolveErrorMessage: jest.fn(),
}));

describe('ARIN client', () => {
    const mockedAxios = axios as jest.Mocked<typeof axios>;
    const mockedXmlToASSetObject = xmlToASSetObject as jest.MockedFunction<
        typeof xmlToASSetObject
    >;
    const mockedAsSetObjectToXML = asSetObjectToXML as jest.MockedFunction<
        typeof asSetObjectToXML
    >;
    const mockedResolveErrorMessage =
        resolveErrorMessage as jest.MockedFunction<typeof resolveErrorMessage>;

    const buildAsSetObject = () =>
        new ASSetObject(
            'AS-EXAMPLE-ARIN',
            IRR.Source.ARIN,
            new ASSetContent([new ASSetMember('AS65001', IRR.Source.undetermined)]),
            [{ name: 'ORG-TEST', source: IRR.Source.ARIN }],
        );

    beforeEach(() => {
        mockedAxios.get.mockReset();
        mockedAxios.post.mockReset();
        mockedAxios.put.mockReset();
        mockedAxios.delete.mockReset();
        mockedXmlToASSetObject.mockReset();
        mockedAsSetObjectToXML.mockReset();
        mockedResolveErrorMessage.mockReset();
    });

    test('queryASSet returns parsed ASSetObject on 200 response', async () => {
        const arin = new ARIN('API-TOKEN', 'EXAMPLEORG');
        const expected = buildAsSetObject();

        mockedAxios.get.mockResolvedValue({
            status: 200,
            data: '<asSet />',
        } as never);
        mockedXmlToASSetObject.mockReturnValue(expected);

        const result = await arin.queryASSet('AS-EXAMPLE-ARIN');

        expect(result).toBe(expected);
        expect(mockedAxios.get).toHaveBeenCalledWith(
            'https://reg.arin.net/rest/irr/as-set/AS-EXAMPLE-ARIN?apikey=API-TOKEN',
            expect.objectContaining({
                headers: expect.objectContaining({
                    'User-Agent': 'Mitei',
                    Accept: 'application/xml',
                }),
            }),
        );
    });

    test('queryASSet throws with resolved error details on non-200 response', async () => {
        const arin = new ARIN('API-TOKEN', 'EXAMPLEORG');

        mockedAxios.get.mockResolvedValue({
            status: 404,
            data: '<error />',
        } as never);
        mockedResolveErrorMessage.mockReturnValue({
            errorCode: '404',
            errorMessage: 'Not found',
        });

        await expect(arin.queryASSet('AS-MISSING')).rejects.toThrow(
            /Failed to query AS-SET\. Status: 404, Code: 404, Message: Not found/,
        );
    });

    test('createASSet posts XML and returns true on 200', async () => {
        const arin = new ARIN('API-TOKEN', 'EXAMPLEORG');
        const asSet = buildAsSetObject();

        mockedAsSetObjectToXML.mockReturnValue('<xml />');
        mockedAxios.post.mockResolvedValue({ status: 200 } as never);

        const result = await arin.createASSet(asSet);

        expect(result).toBe(true);
        expect(mockedAsSetObjectToXML).toHaveBeenCalledWith(asSet);
        expect(mockedAxios.post).toHaveBeenCalledWith(
            'https://reg.arin.net/rest/irr/as-set?apikey=API-TOKEN&orgHandle=ORG-TEST',
            '<xml />',
            expect.objectContaining({
                headers: expect.objectContaining({
                    'Content-Type': 'application/xml',
                }),
            }),
        );
    });

    test('listASSets handles array, single item and empty collection', async () => {
        const arin = new ARIN('API-TOKEN', 'DEFAULTORG');

        mockedAxios.get
            .mockResolvedValueOnce({
                status: 200,
                data: '<collection><asSetRef name="AS-A"/><asSetRef name="AS-B"/></collection>',
            } as never)
            .mockResolvedValueOnce({
                status: 200,
                data: '<collection><asSetRef name="AS-ONLY"/></collection>',
            } as never)
            .mockResolvedValueOnce({
                status: 200,
                data: '<collection></collection>',
            } as never);

        await expect(arin.listASSets('ORG1')).resolves.toEqual([
            { name: 'AS-A' },
            { name: 'AS-B' },
        ]);
        await expect(arin.listASSets('ORG2')).resolves.toEqual([
            { name: 'AS-ONLY' },
        ]);
        await expect(arin.listASSets('ORG3')).resolves.toEqual([]);
    });

    test('modifyASSet and deleteASSet return true on 200 and throw on failure', async () => {
        const arin = new ARIN('API-TOKEN', 'EXAMPLEORG');
        const asSet = buildAsSetObject();

        mockedAsSetObjectToXML.mockReturnValue('<xml />');

        mockedAxios.put.mockResolvedValueOnce({ status: 200 } as never);
        await expect(arin.modifyASSet(asSet)).resolves.toBe(true);

        mockedResolveErrorMessage.mockReturnValue({
            errorCode: '500',
            errorMessage: 'Server error',
        });
        mockedAxios.put.mockResolvedValueOnce({ status: 500, data: '<error />' } as never);
        await expect(arin.modifyASSet(asSet)).rejects.toThrow(/Failed to modify AS-SET/);

        mockedAxios.delete.mockResolvedValueOnce({ status: 200 } as never);
        await expect(arin.deleteASSet('AS-EXAMPLE-ARIN')).resolves.toBe(true);

        mockedAxios.delete.mockResolvedValueOnce({
            status: 403,
            data: '<error />',
        } as never);
        await expect(arin.deleteASSet('AS-EXAMPLE-ARIN')).rejects.toThrow(
            /Failed to delete AS-SET/,
        );
    });
});
