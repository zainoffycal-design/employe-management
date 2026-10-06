import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const envPath = new URL('../.env.production', import.meta.url);
const text = readFileSync(envPath, 'utf8');
const vars = {};

for (const line of text.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq === -1) continue;
  const name = trimmed.slice(0, eq).trim();
  let value = trimmed.slice(eq + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  if (name.startsWith('VITE_') && value) vars[name] = value;
}

if (!vars.VITE_OPENAI_API_KEY) {
  console.error('Add VITE_OPENAI_API_KEY to .env.production before deploying.');
  process.exit(1);
}

const vercel = (args, { allowFailure = false } = {}) => {
  const result = spawnSync('npx', ['vercel', ...args], { stdio: 'inherit' });
  if (!allowFailure && result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

if (!existsSync(new URL('../.vercel/project.json', import.meta.url))) {
  vercel(['link', '--yes']);
}

const obsolete = [
  'VITE_GEMINI_API_KEY',
  'VITE_GEMINI_MODEL',
  'VITE_GROQ_API_KEY',
  'VITE_GROQ_MODEL'
];

for (const name of obsolete) {
  vercel(['env', 'rm', name, 'production,preview,development', '--yes'], { allowFailure: true });
}

for (const [name, value] of Object.entries(vars)) {
  const sensitive = /KEY|SECRET|TOKEN/i.test(name);
  vercel([
    'env',
    'add',
    name,
    'production,preview,development',
    '--value',
    value,
    '--yes',
    '--force',
    sensitive ? '--sensitive' : '--no-sensitive'
  ]);
}

console.log('Vercel environment updated from .env.production.');
