#!/usr/bin/env node
/**
 * Start http-server on the first available port starting from BASE_PORT.
 * Binds only to 127.0.0.1 and opens the browser automatically.
 */
const net  = require('net');
const { spawn } = require('child_process');

const BASE_PORT = 8081;
const HOST      = '127.0.0.1';

function findFreePort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(findFreePort(port + 1)));
    server.once('listening', () => server.close(() => resolve(port)));
    server.listen(port, HOST);
  });
}

findFreePort(BASE_PORT).then((port) => {
  console.log(`\n  Starting dev server on http://${HOST}:${port}\n`);
  const proc = spawn(
    'npx', ['http-server', '.', '-p', String(port), '-a', HOST, '--silent', '-o'],
    { stdio: 'inherit', shell: true },
  );
  proc.on('exit', (code) => process.exit(code ?? 0));
});
