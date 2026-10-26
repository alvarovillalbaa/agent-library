import { makeFunctionReference } from 'convex/server';
import type { CatalogResponse, Entry, Kind, ReviewResult, Submission } from './types';

export const listEntries = makeFunctionReference<'query', { kind?: Kind; area?: string; owner?: string; search?: string }, CatalogResponse>('catalog:list');
export const getEntry = makeFunctionReference<'query', { slug: string }, Entry | null>('catalog:detail');
export const reviewSubmission = makeFunctionReference<'action', { submission: Submission }, ReviewResult>('review:submit');

export function externalUrl(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : undefined;
  } catch { return undefined; }
}

export function installCommand(repository?: string): string | undefined {
  if (!repository) return undefined;
  try {
    const url = new URL(repository);
    const match = url.pathname.match(/^\/([\w-]+)\/([\w.-]+?)(?:\.git)?\/?$/);
    if (url.protocol !== 'https:' || url.hostname !== 'github.com' || url.username || url.password || !match) return undefined;
    return `npx skills add ${match[1]}/${match[2]}`;
  } catch { return undefined; }
}
