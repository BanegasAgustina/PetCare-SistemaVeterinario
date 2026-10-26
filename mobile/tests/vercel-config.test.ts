import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { PRODUCTION_API_URL, resolveApiUrl } from '../src/services/api';

const vercelConfig = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8')) as {
  build?: { env?: Record<string, string> };
  buildCommand?: string;
  outputDirectory?: string;
};

test('Vercel web build has the production API configuration required by login', () => {
  const buildEnv = vercelConfig.build?.env;

  assert.equal(vercelConfig.buildCommand, 'npx expo export -p web');
  assert.equal(vercelConfig.outputDirectory, 'dist');
  assert.equal(buildEnv?.EXPO_PUBLIC_APP_ENV, 'production');
  assert.equal(buildEnv?.EXPO_PUBLIC_API_URL, PRODUCTION_API_URL);
  assert.equal(
    resolveApiUrl(buildEnv?.EXPO_PUBLIC_API_URL, buildEnv?.EXPO_PUBLIC_APP_ENV, false),
    PRODUCTION_API_URL,
  );
});
