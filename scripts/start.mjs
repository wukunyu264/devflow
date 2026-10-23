import {fileURLToPath} from 'node:url';
import nextEnv from '@next/env';
import {backendConfig} from '../src/lib/backend.ts';

// Next 16.4 logs Ready before loading config/instrumentation. Validate before
// launching its CLI; retain instrumentation as the serverless startup guard.
process.env.NODE_ENV ||= 'production';
nextEnv.loadEnvConfig(process.cwd(), false, {info() {}, error() {}});
try { backendConfig(); }
catch (error) { console.error('[DevFlow startup]', error instanceof Error ? error.message : 'Invalid backend configuration'); process.exit(1); }
// Run the official CLI in this process so signals and test cleanup have no orphan child.
const nextCli = new URL('../node_modules/next/dist/bin/next',import.meta.url);
process.argv = [process.execPath,fileURLToPath(nextCli),'start',...process.argv.slice(2)];
await import(nextCli.href);
