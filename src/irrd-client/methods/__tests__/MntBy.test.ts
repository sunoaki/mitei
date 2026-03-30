import type { ApolloClient } from '@apollo/client';
import getMntBy from '../MntBy';

describe('irrd-client getMntBy', () => {
    test('returns empty list when response has no objects', async () => {
        const client = {
            query: jest.fn().mockResolvedValue({
                data: {
                    rpslObjects: [],
                },
            }),
        } as unknown as ApolloClient;

        await expect(getMntBy(client, 'AS-EMPTY')).resolves.toEqual([]);
    });

    test('selects first matching source from response order and maps mntBy refs', async () => {
        const client = {
            query: jest.fn().mockResolvedValue({
                data: {
                    rpslObjects: [
                        {
                            rpslPk: 'AS-EXAMPLE',
                            source: 'RADB',
                            mntBy: ['MNT-RADB'],
                        },
                        {
                            rpslPk: 'AS-EXAMPLE',
                            source: 'RIPE',
                            mntBy: ['MNT-RIPE', ''],
                        },
                    ],
                },
            }),
        } as unknown as ApolloClient;

        const refs = await getMntBy(client, 'AS-EXAMPLE', {
            sources: ['RIPE', 'RADB'],
            objectClass: ['as-set'],
        });

        expect((client.query as jest.Mock).mock.calls[0][0].variables).toEqual({
            rpslPk: ['AS-EXAMPLE'],
            sources: ['RIPE', 'RADB'],
            objectClass: ['as-set'],
        });

        expect(refs).toEqual([{ name: 'MNT-RADB', source: 'RADB' }]);
    });

    test('selects preferred source when only one preferred source is supplied', async () => {
        const client = {
            query: jest.fn().mockResolvedValue({
                data: {
                    rpslObjects: [
                        {
                            rpslPk: 'AS-EXAMPLE',
                            source: 'RADB',
                            mntBy: ['MNT-RADB'],
                        },
                        {
                            rpslPk: 'AS-EXAMPLE',
                            source: 'RIPE',
                            mntBy: ['MNT-RIPE'],
                        },
                    ],
                },
            }),
        } as unknown as ApolloClient;

        const refs = await getMntBy(client, 'AS-EXAMPLE', {
            sources: ['RIPE'],
        });

        expect(refs).toEqual([{ name: 'MNT-RIPE', source: 'RIPE' }]);
    });

    test('falls back to first object and respects refSourceOverride', async () => {
        const client = {
            query: jest.fn().mockResolvedValue({
                data: {
                    rpslObjects: [
                        {
                            rpslPk: 'AS-EXAMPLE',
                            source: 'RADB',
                            mntBy: ['MNT-RADB'],
                        },
                    ],
                },
            }),
        } as unknown as ApolloClient;

        const refs = await getMntBy(client, 'AS-EXAMPLE', {
            sources: ['LACNIC'],
            refSourceOverride: 'NTTCOM',
        });

        expect(refs).toEqual([{ name: 'MNT-RADB', source: 'NTTCOM' }]);
    });

    test('throws when response does not match schema', async () => {
        const client = {
            query: jest.fn().mockResolvedValue({
                data: {
                    wrongKey: [],
                },
            }),
        } as unknown as ApolloClient;

        await expect(getMntBy(client, 'AS-BAD')).rejects.toThrow(
            /Invalid IRRD rpslObjects response/,
        );
    });
});
