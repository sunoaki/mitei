import { ASSetContent, ASSetMember } from 'src/core/IRR/AS_SET';
import IRRDClient from 'src/irrd-client/index';
import { AS_SET_Member } from '../as_set';

jest.mock('src/irrd-client/index', () => ({
    __esModule: true,
    default: jest.fn(),
}));

describe('easy AS_SET member', () => {
    const IRRDClientMock = IRRDClient as unknown as jest.Mock;

    beforeEach(() => {
        IRRDClientMock.mockReset();
    });

    test('toStaticASSetContent uses first source and keeps remarks', () => {
        const member = new AS_SET_Member({
            setName: 'AS-EXAMPLE',
            flatten: false,
            sources: ['RIPE', 'RADB'],
            remarks: ['static member'],
        });

        const content = member.toStaticASSetContent();

        expect(content.members).toHaveLength(1);
        expect(content.members[0]).toEqual(
            new ASSetMember('AS-EXAMPLE', 'RIPE', ['static member']),
        );
    });

    test('toASSetContent returns static content when flatten is false', async () => {
        const member = new AS_SET_Member({
            setName: 'AS-STATIC',
            flatten: false,
        });

        const content = await member.toASSetContent();

        expect(content.members).toHaveLength(1);
        expect(content.members[0].name).toBe('AS-STATIC');
    });

    test('toFlattenedASSetContent calls IRRD with default endpoint and defaults', async () => {
        const flattened = new ASSetContent([
            new ASSetMember('AS65001', 'undetermined'),
        ]);

        const getASSetObject = jest.fn().mockResolvedValue([
            {
                content: flattened,
            },
        ]);

        IRRDClientMock.mockImplementation(() => ({
            getASSetObject,
        }));

        const member = new AS_SET_Member({
            setName: 'AS-FLATTEN',
            flatten: true,
        });

        const result = await member.toFlattenedASSetContent();

        expect(IRRDClientMock).toHaveBeenCalledWith({
            endpoint: 'https://rr.ntt.net/graphql',
        });
        expect(getASSetObject).toHaveBeenCalledWith('AS-FLATTEN', {
            sources: undefined,
            depth: -1,
        });
        expect(result).toBe(flattened);
    });

    test('toFlattenedASSetContent uses custom endpoint/options and throws on empty response', async () => {
        const getASSetObject = jest.fn().mockResolvedValue([]);

        IRRDClientMock.mockImplementation(() => ({
            getASSetObject,
        }));

        const member = new AS_SET_Member({
            setName: 'AS-NOT-FOUND',
            flatten: true,
            irrdGraphQLEndpoint: 'https://example.test/graphql',
            sources: ['RADB'],
            depth: 2,
        });

        await expect(member.toFlattenedASSetContent()).rejects.toThrow(
            /AS-SET AS-NOT-FOUND not found/,
        );

        expect(IRRDClientMock).toHaveBeenCalledWith({
            endpoint: 'https://example.test/graphql',
        });
        expect(getASSetObject).toHaveBeenCalledWith('AS-NOT-FOUND', {
            sources: ['RADB'],
            depth: 2,
        });
    });

    test('getExcludeContent returns empty array when exclude is undefined', async () => {
        const member = new AS_SET_Member({
            setName: 'AS-WITHOUT-EXCLUDE',
            flatten: true,
        });

        const result = await member.getExcludeContent();

        expect(result).toEqual([]);
    });

    test('getExcludeContent resolves all exclude members', async () => {
        const excludeOne = {
            type: 'AS_NUMBER' as const,
            toASSetContent: async () =>
                new ASSetContent([new ASSetMember('AS65100', 'undetermined')]),
        };
        const excludeTwo = {
            type: 'AS_NUMBER' as const,
            toASSetContent: async () =>
                new ASSetContent([new ASSetMember('AS65101', 'undetermined')]),
        };

        const member = new AS_SET_Member({
            setName: 'AS-EXCLUDE',
            flatten: true,
            exclude: [excludeOne, excludeTwo],
        });

        const result = await member.getExcludeContent();

        expect(result).toHaveLength(2);
        expect(result[0].members.some((m) => m.name === 'AS65100')).toBe(true);
        expect(result[1].members.some((m) => m.name === 'AS65101')).toBe(true);
    });

    test('toASSetContent applies exclude members on flattened content', async () => {
        const flattened = new ASSetContent([
            new ASSetMember('AS65200', 'undetermined'),
            new ASSetMember('AS65201', 'undetermined'),
        ]);

        const getASSetObject = jest.fn().mockResolvedValue([
            {
                content: flattened,
            },
        ]);

        IRRDClientMock.mockImplementation(() => ({
            getASSetObject,
        }));

        const excludeMember = {
            type: 'AS_NUMBER' as const,
            toASSetContent: async () =>
                new ASSetContent([new ASSetMember('AS65200', 'undetermined')]),
        };

        const member = new AS_SET_Member({
            setName: 'AS-APPLY-EXCLUDE',
            flatten: true,
            exclude: [excludeMember],
        });

        const result = await member.toASSetContent();

        expect(result.members.some((m) => m.name === 'AS65200')).toBe(false);
        expect(result.members.some((m) => m.name === 'AS65201')).toBe(true);
    });
});
