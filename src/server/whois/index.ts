import { createServer } from 'node:net';
import type { Socket } from 'node:net';
import type IRRSelector from '../../core/IRR/manager/selector';
import Type, { type Static, type TSchema } from 'typebox';
import Value from 'typebox/value';
import { IRR as IRRTypes } from '../../core/IRR/types';
import { inSource, isRPSLName } from '../../core/IRR/base/tools';

const whoisTokenSchema = Type.String({ minLength: 1 });
const whoisTokenListSchema = Type.Array(whoisTokenSchema, { minItems: 1 });
const whoisUUIDSchema = Type.String({
    pattern:
        '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
});
const whoisTypeSchema = Type.Enum(IRRTypes.Type);

function assertValid<Schema extends TSchema>(
    schema: Schema,
    value: unknown,
    label: string,
): asserts value is Static<Schema> {
    if (Value.Check(schema, value)) {
        return;
    }

    const [firstError] = Value.Errors(schema, value);
    const path = firstError?.instancePath ? `$${firstError.instancePath}` : '$';
    const message = firstError?.message ?? 'schema validation failed';
    throw new Error(`Invalid ${label}: ${path} ${message}`);
}

function parseTokenList(raw: string, label: string): string[] {
    const tokens = raw
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

    assertValid(whoisTokenListSchema, tokens, label);
    return tokens;
}

function parseNameList(raw: string): string[] {
    const names = parseTokenList(raw, 'name list');

    for (const name of names) {
        if (!isRPSLName(name)) {
            throw new Error(`Invalid name provided: ${name}`);
        }
    }

    return names;
}

function parseSourceList(raw: string): IRRTypes.Source[] {
    const sources = parseTokenList(raw, 'source list').map((s) =>
        s.toUpperCase(),
    );

    for (const source of sources) {
        if (!inSource(source)) {
            throw new Error(`Invalid source provided: ${source}`);
        }
    }

    return sources as IRRTypes.Source[];
}

function parseTypeList(raw: string): IRRTypes.Type[] {
    const types = parseTokenList(raw, 'type list').map((s) => s.toLowerCase());

    for (const type of types) {
        if (!Value.Check(whoisTypeSchema, type)) {
            throw new Error(`Invalid type provided: ${type}`);
        }
    }

    return types as IRRTypes.Type[];
}

function parseUUIDList(raw: string): string[] {
    const uuids = parseTokenList(raw, 'uuid list');

    for (const uuid of uuids) {
        if (!Value.Check(whoisUUIDSchema, uuid)) {
            throw new Error(`Invalid UUID provided: ${uuid}`);
        }
    }

    return uuids;
}

export class whoisServer {
    public status: 'running' | 'stopped' = 'stopped';
    private server: ReturnType<typeof createServer>;
    private IRRSelector: IRRSelector;

    public banner: string[] = [];

    constructor(irrSelector: IRRSelector) {
        this.IRRSelector = irrSelector;

        this.server = createServer((socket) => {
            socket.setEncoding('utf-8');

            socket.on('data', (data) => {
                this.handleRequest(socket, data.toString());

                socket.end();
            });

            socket.on('error', (err) => {
                console.error('Whois Server Socket error:', err);
            });
        });
    }

    listen(port: number = 43, host: string = '0.0.0.0') {
        if (this.status === 'running')
            throw new Error('Whois Server is already running.');
        this.server.listen(port, host, () => {
            this.status = 'running';
        });
    }

    close() {
        if (this.status === 'stopped')
            throw new Error('Whois Server is not running.');
        this.server.close(() => {
            this.status = 'stopped';
        });
    }

    private nameQuery(query: string, selector: IRRSelector): IRRSelector {
        const parts = query.split('::');
        if (parts.length > 2) {
            throw new Error(`Invalid scoped query: ${query}`);
        }

        if (parts.length === 2) {
            const sources = parseSourceList(parts[0]);
            selector = selector.selectBySource(
                sources.length === 1 ? sources[0] : sources,
            );
        }

        const nameTypeParts = parts[parts.length - 1].split('@');
        if (nameTypeParts.length > 2) {
            throw new Error(`Invalid typed query: ${query}`);
        }

        if (nameTypeParts.length === 2) {
            const types = parseTypeList(nameTypeParts[1]);
            selector = selector.selectByType(
                types.length === 1 ? types[0] : types,
            );
        }

        selector = selector.selectByName(parseNameList(nameTypeParts[0]));

        return selector;
    }

    /**
     * Query format:
     * - Select By RPSL Name: "name <name>,<name>,..." # also as default if no prefix
     *
     * - Select By RPSL Source "source <source>,<source>,..."
     *   or use <source>::<name> format
     *
     * - Select By RPSL Object Type "type <type>,<type>,..."
     *   or use <name>@<type> format
     *
     * - Select By IRRManager UUID "uuid <id>,<id>,..."
     *
     * all queries can be combined, e.g. "name <name> source <source>" or "<source>::<name>@<type>"
     *
     * @argument queryName - the query string to parse and execute
     * @returns IRRSelector - the resulting selector based on the query
     */
    public query(queryName: string): IRRSelector {
        const query = queryName.trim().toLowerCase();

        let selector: IRRSelector = this.IRRSelector.clone();

        const arg = query
            .split(/\s+/)
            .map((s) => s.trim())
            .filter((s) => s.length > 0);

        if (arg.length === 0) {
            return selector.selectByName(['']);
        }

        for (let i = 0; i < arg.length; i++) {
            switch (arg[i]) {
                case 'name':
                    if (i + 1 >= arg.length) {
                        throw new Error('Missing value for name query.');
                    }
                    selector = this.nameQuery(arg[++i], selector);
                    break;
                case 'source':
                    if (i + 1 >= arg.length) {
                        throw new Error('Missing value for source query.');
                    }
                    {
                        const sources = parseSourceList(arg[++i]);
                        selector = selector.selectBySource(
                            sources.length === 1 ? sources[0] : sources,
                        );
                    }
                    break;
                case 'type':
                    if (i + 1 >= arg.length) {
                        throw new Error('Missing value for type query.');
                    }
                    {
                        const types = parseTypeList(arg[++i]);
                        selector = selector.selectByType(
                            types.length === 1 ? types[0] : types,
                        );
                    }
                    break;
                case 'uuid':
                    if (i + 1 >= arg.length) {
                        throw new Error('Missing value for uuid query.');
                    }
                    selector = selector.selectByUUIDs(parseUUIDList(arg[++i]));
                    break;
                default:
                    selector = this.nameQuery(arg[i], selector);
                    break;
            }
        }

        return selector;
    }

    private handleRequest(socket: Socket, data: string) {
        if (this.banner.length > 0) {
            socket.write(this.banner.join('\n'));
            socket.write('\n');
        }

        try {
            const startTime = Date.now();
            const selector = this.query(data);
            const endTime = Date.now();

            const results = selector.resultsMap;

            if (selector.results.length === 0) {
                socket.write(
                    '% No entries found for the selected source(s).\n',
                );
            } else {
                socket.write(`% Query: ${data.trim()}\n\n`);
                socket.write(`% ${selector.results.length} objects found.\n\n`);

                for (const result in results) {
                    socket.write(
                        `${results[result].toRPSL()}uuid: ${result}\n\n`,
                    );
                }

                socket.write(
                    `% ${selector.queryTimes} queries in ${endTime - startTime} ms.\n`,
                );
            }
        } catch (error) {
            console.error('Error handling whois request:', error);
            socket.write('Invalid query format.\n');
        }
    }
}

export default whoisServer;
