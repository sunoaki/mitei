import { IRR as IRRTypes } from '../../../core/IRR/types';
import {
    ASSetContent,
    ASSetMember,
    ASSetObject,
} from '../../../core/IRR/AS_SET';
import IRRManager from '../../../core/IRR/manager/manager';
import WhoisServer from '../index';
import { buildAuthContext } from '../../../access-control/authorization';

function createMockSocket() {
    const chunks: string[] = [];

    return {
        socket: {
            write: (chunk: string) => {
                chunks.push(chunk);
            },
        } as unknown as { write: (chunk: string) => void },
        readOutput: () => chunks.join(''),
    };
}

describe('whois query syntax', () => {
    const buildObject = (name: string, source: IRRTypes.Source, asn: string) =>
        new ASSetObject(
            name,
            source,
            new ASSetContent([
                new ASSetMember(asn, IRRTypes.Source.undetermined),
            ]),
        );

    test('supports combined keyword query: name/source/type/uuid', () => {
        const manager = new IRRManager();
        const firstUUID = manager.register(
            buildObject('AS-ONE', IRRTypes.Source.RADB, 'AS65001'),
        );
        manager.register(
            buildObject('AS-TWO', IRRTypes.Source.RIPE, 'AS65002'),
        );

        const whois = new WhoisServer(manager.selector);
        const selector = whois.query(
            `name as-one source radb type as-set uuid ${firstUUID}`,
        );

        expect(selector.results).toHaveLength(1);
        expect(selector.uuids).toEqual([firstUUID]);
        expect(selector.results[0].name).toBe('as-one');
    });

    test('supports scoped shorthand query: source::name@type', () => {
        const manager = new IRRManager();
        manager.register(
            buildObject('AS-ALPHA', IRRTypes.Source.RADB, 'AS65010'),
        );
        manager.register(
            buildObject('AS-BETA', IRRTypes.Source.RIPE, 'AS65011'),
        );

        const whois = new WhoisServer(manager.selector);
        const selector = whois.query('radb::as-alpha@as-set');

        expect(selector.results).toHaveLength(1);
        expect(selector.results[0].source).toBe(IRRTypes.Source.RADB);
        expect(selector.results[0].name).toBe('as-alpha');
    });

    test('supports multi-token filters with commas', () => {
        const manager = new IRRManager();
        manager.register(buildObject('AS-X', IRRTypes.Source.RADB, 'AS65100'));
        manager.register(buildObject('AS-Y', IRRTypes.Source.RIPE, 'AS65101'));

        const whois = new WhoisServer(manager.selector);
        const selector = whois.query(
            'name as-x,as-y source radb,ripe type as-set',
        );

        expect(selector.results).toHaveLength(2);
    });

    test('throws on invalid uuid token', () => {
        const manager = new IRRManager();
        manager.register(
            buildObject('AS-ERR', IRRTypes.Source.RADB, 'AS65200'),
        );

        const whois = new WhoisServer(manager.selector);

        expect(() => whois.query('uuid not-a-uuid')).toThrow(
            /Invalid UUID provided/,
        );
    });

    test('throws on missing value after keyword tokens', () => {
        const manager = new IRRManager();
        manager.register(
            buildObject('AS-MISS', IRRTypes.Source.RADB, 'AS65300'),
        );
        const whois = new WhoisServer(manager.selector);

        expect(() => whois.query('name')).toThrow(
            /Missing value for name query/,
        );
        expect(() => whois.query('source')).toThrow(
            /Missing value for source query/,
        );
        expect(() => whois.query('type')).toThrow(
            /Missing value for type query/,
        );
        expect(() => whois.query('uuid')).toThrow(
            /Missing value for uuid query/,
        );
    });

    test('throws on invalid source/type/name syntax branches', () => {
        const manager = new IRRManager();
        manager.register(
            buildObject('AS-SYNTAX', IRRTypes.Source.RADB, 'AS65400'),
        );
        const whois = new WhoisServer(manager.selector);

        expect(() => whois.query('source ***')).toThrow(
            /Invalid source provided/,
        );
        expect(() => whois.query('type invalid-type')).toThrow(
            /Invalid type provided/,
        );
        expect(() => whois.query('name ???')).toThrow(/Invalid name provided/);
    });

    test('throws on invalid scoped and typed shorthand syntax', () => {
        const manager = new IRRManager();
        manager.register(
            buildObject('AS-SHORT', IRRTypes.Source.RADB, 'AS65500'),
        );
        const whois = new WhoisServer(manager.selector);

        expect(() => whois.query('radb::ripe::as-short')).toThrow(
            /Invalid scoped query/,
        );
        expect(() => whois.query('as-short@as-set@as-set')).toThrow(
            /Invalid typed query/,
        );
    });

    test('filters result output by irrobject read permission', async () => {
        const manager = new IRRManager();
        manager.register(
            buildObject('AS-ALLOWED', IRRTypes.Source.RADB, 'AS65021'),
        );
        manager.register(
            buildObject('AS-DENIED', IRRTypes.Source.RADB, 'AS65022'),
        );

        const context = buildAuthContext(
            {
                issuer: 'mitei-internal',
                subject: 'mitei-internal-whois',
                scopes: [],
                tokenType: 'dev',
                rawClaims: {},
            },
            {
                id: 'u-whois',
                issuer: 'mitei-internal',
                subject: 'mitei-internal-whois',
                displayName: 'mitei-internal-whois',
                enabled: true,
                roles: ['viewer'],
                scopes: {
                    grant: [],
                    deny: [],
                },
                resourceRules: [
                    {
                        resource: 'irrobject',
                        action: 'read',
                        objectPattern: 'as-allowed@*',
                    },
                ],
                createdAt: '2024-01-01T00:00:00.000Z',
                updatedAt: '2024-01-01T00:00:00.000Z',
            },
        );

        const whois = new WhoisServer(manager.selector, {
            getAuthContext: async () => context,
        });

        const { socket, readOutput } = createMockSocket();

        await (
            whois as unknown as {
                handleRequest: (
                    socket: unknown,
                    request: string,
                ) => Promise<void>;
            }
        ).handleRequest(
            socket,
            'name as-allowed,as-denied source radb type as-set',
        );

        const output = readOutput();

        expect(output).toContain('as-set: as-allowed');
        expect(output).not.toContain('as-set: as-denied');
        expect(output).toContain('% 1 objects found.');
    });
});
