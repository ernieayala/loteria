import { networkInterfaces, type NetworkInterfaceInfo } from 'node:os';
import { startServer } from './server.js';

const DEFAULT_PORT = 3000;

function readPort(raw: string | undefined): number {
  if (raw === undefined || raw === '') return DEFAULT_PORT;
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`PORT must be an integer from 0 to 65535, got "${raw}"`);
  }
  return port;
}

const dev = process.argv.includes('--dev');
const server = await startServer({ port: readPort(process.env.PORT), dev });

// Phones cannot reach "localhost", so print the addresses they can.
const lanUrls = Object.values(networkInterfaces())
  .flat()
  .filter((a): a is NetworkInterfaceInfo => a !== undefined && a.family === 'IPv4' && !a.internal)
  .map((a) => `http://${a.address}:${server.port}`);
console.log(`Lotería ${dev ? 'dev server' : 'server'} on http://localhost:${server.port}`);
for (const url of lanUrls) console.log(`  Phones on the same Wi-Fi: ${url}`);

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => void server.close().then(() => process.exit(0)));
}
