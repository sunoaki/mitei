import Fastify from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';

import startServer from './server';

const server = Fastify();

if (process.env.NODE_ENV !== 'production') {
    await server.register(swagger, {
        openapi: {
            info: {
                title: '@mitei/http-api',
                version: '1.0.0',
            },
        },
    });

    await server.register(swaggerUI, {
        routePrefix: '/documentation',
    });
}

try {
    await server.register(startServer, {});
    await server.listen({ port: 3000 });
    console.log('Server is running on http://localhost:3000');
} catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
}
