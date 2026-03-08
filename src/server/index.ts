import Fastify from 'fastify';

const server = Fastify();

try {
    await server.listen({ port: 3000 });
    console.log('Server is running on http://localhost:3000');
} catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
}
