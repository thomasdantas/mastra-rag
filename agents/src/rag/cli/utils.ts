import { createHash } from 'node:crypto';

export interface ParsedCliArgs {
  positional: string[];
  flags: Record<string, string | boolean>;
}

export function parseCliArgs(argv: string[]): ParsedCliArgs {
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) {
      positional.push(arg);
      continue;
    }

    const trimmed = arg.slice(2);
    const [rawKey, inlineValue] = trimmed.split('=');
    if (!rawKey) {
      continue;
    }

    if (inlineValue !== undefined) {
      flags[rawKey] = inlineValue;
      continue;
    }

    const next = argv[index + 1];
    if (next && !next.startsWith('--')) {
      flags[rawKey] = next;
      index += 1;
      continue;
    }

    flags[rawKey] = true;
  }

  return { positional, flags };
}

export function normalizeSourceUrl(input: string): string {
  const url = new URL(input);
  url.hash = '';
  return url.toString();
}

export function buildDocumentId(sourceUrl: string): string {
  return createHash('sha256').update(sourceUrl).digest('hex').slice(0, 16);
}

export function getStringFlag(
  flags: Record<string, string | boolean>,
  ...names: string[]
): string | undefined {
  for (const name of names) {
    const value = flags[name];
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }

  return undefined;
}

export function isPdfUrl(url: string): boolean {
  return url.toLowerCase().split('?')[0].endsWith('.pdf');
}
