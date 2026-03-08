import { createServer } from 'node:net';
import type { Socket } from 'node:net';
import type IRRSelector from '../../core/IRR/manager/selector';

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
        if (parts.length == 2) {
            selector = selector.selectBySource(parts[0].trim().toUpperCase());
        }

        const nameTypeParts = parts[parts.length - 1].split('@');
        if (nameTypeParts.length == 2) {
            selector = selector.selectByType(nameTypeParts[1].trim() as any);
        }

        selector = selector.selectByName(
            nameTypeParts[0].split(',').map((s) => s.trim()),
        );

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

        const arg = query.split(' ');

        for (let i = 0; i < arg.length; i++) {
            switch (arg[i]) {
                case 'name':
                    if (i + 1 < arg.length) {
                        selector = this.nameQuery(arg[++i], selector);
                    }
                    break;
                case 'source':
                    if (i + 1 < arg.length) {
                        selector = selector.selectBySource(
                            arg[++i]
                                .split(',')
                                .map((s) => s.trim().toUpperCase()),
                        );
                    }
                    break;
                case 'type':
                    if (i + 1 < arg.length) {
                        selector = selector.selectByType(
                            arg[++i].split(',').map((s) => s.trim() as any),
                        );
                    }
                    break;
                case 'uuid':
                    if (i + 1 < arg.length) {
                        selector = selector.selectByUUIDs(
                            arg[++i].split(',').map((s) => s.trim()),
                        );
                    }
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
