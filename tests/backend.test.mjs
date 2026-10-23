import test from 'node:test';
import assert from 'node:assert/strict';
import { backendConfig } from '../src/lib/backend.ts';

test('backend selection fails closed and names missing configuration without leaking values', () => {
  assert.equal(backendConfig({}).backend, 'local');
  assert.equal(backendConfig({NODE_ENV:'production',DATA_BACKEND:'local'}).backend, 'local');
  assert.throws(() => backendConfig({NODE_ENV:'production'}), /NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  assert.throws(() => backendConfig({DATA_BACKEND:'supabase',NEXT_PUBLIC_SUPABASE_URL:'https://example.test'}), /missing NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  for (const name of ['VERCEL','NETLIFY','AWS_LAMBDA_FUNCTION_NAME','K_SERVICE']) {
    assert.throws(() => backendConfig({DATA_BACKEND:'local',[name]:'1'}), /not supported in serverless/);
    assert.throws(() => backendConfig({[name]:'1'}), /missing NEXT_PUBLIC_SUPABASE_URL/);
  }
  assert.throws(() => backendConfig({DATA_BACKEND:'other'}), /must be supabase or local/);
});
