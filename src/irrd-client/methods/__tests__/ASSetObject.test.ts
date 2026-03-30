import type { ApolloClient } from '@apollo/client';
import { IRR } from '../../../core/IRR/types';
import getASSetObject, {
    parseAsnToken,
    RECURSIVE_SET_MEMBERS_QUERY,
} from '../ASSetObject';
import getMntBy from '../MntBy';

jest.mock('../MntBy', () => ({
    __esModule: true,
    default: jest.fn(),
}));

describe('irrd-client getASSetObject', () => {
    const mockedGetMntBy = getMntBy as jest.MockedFunction<typeof getMntBy>;

    beforeEach(() => {
        mockedGetMntBy.mockReset();
    });

    test('parseAsnToken normalizes and rejects blanks', () => {
        expect(parseAsnToken(' as65001 ')).toBe('AS65001');
        expect(parseAsnToken('')).toBeNull();
        expect(parseAsnToken('   ')).toBeNull();
        expect(parseAsnToken('AS65001:AS-EDGE')).toBe('AS65001:AS-EDGE');
    });

    test('maps recursiveSetMembers response to ASSetObject and sorts by preferred source', async () => {
        mockedGetMntBy
            .mockResolvedValueOnce([{ name: 'MNT-RIPE', source: IRR.Source.RIPE }])
            .mockResolvedValueOnce([{ name: 'MNT-RADB', source: IRR.Source.RADB }]);

        const client = {
            query: jest.fn().mockResolvedValue({
                data: {
                    recursiveSetMembers: [
                        {
                            rpslPk: 'AS-EXAMPLE',
                            rootSource: 'RIPE',
                            members: [' AS65010 ', 'AS65011', 'invalid token'],
                        },
                        {
                            rpslPk: 'AS-EXAMPLE',
                            rootSource: 'RADB',
                            members: ['AS65012'],
                        },
                    ],
                },
            }),
        } as unknown as ApolloClient;

        const result = await getASSetObject(client, 'AS-EXAMPLE', {
            sources: ['RADB', 'RIPE'],
            depth: 2,
            excludeSets: ['AS-IGNORE'],
        });

        expect((client.query as jest.Mock).mock.calls[0][0]).toMatchObject({
            query: RECURSIVE_SET_MEMBERS_QUERY,
            variables: {
                setNames: ['AS-EXAMPLE'],
                depth: 2,
                sources: ['RADB', 'RIPE'],
                excludeSets: ['AS-IGNORE'],
            },
        });

        expect(mockedGetMntBy).toHaveBeenCalledTimes(2);
        expect(mockedGetMntBy).toHaveBeenNthCalledWith(1, client, 'AS-EXAMPLE', {
            sources: IRR.Source.RIPE,
            objectClass: ['as-set'],
            refSourceOverride: 'RIPE',
        });

        expect(result).toHaveLength(2);
        expect(result[0].source).toBe(IRR.Source.RADB);
        expect(result[0].mnt_by).toEqual([{ name: 'MNT-RADB', source: IRR.Source.RADB }]);

        expect(result[1].source).toBe(IRR.Source.RIPE);
        expect(result[1].content.has(65010)).toBe(true);
        expect(result[1].content.has(65011)).toBe(true);
        expect(result[1].content.members.some((m) => m.name === 'INVALID TOKEN')).toBe(false);
    });

    test('throws when AS-SET is not found', async () => {
        mockedGetMntBy.mockResolvedValue([]);

        const client = {
            query: jest.fn().mockResolvedValue({
                data: {
                    recursiveSetMembers: [],
                },
            }),
        } as unknown as ApolloClient;

        await expect(getASSetObject(client, 'AS-NOT-FOUND')).rejects.toThrow(
            /AS-SET not found/,
        );
    });
});
