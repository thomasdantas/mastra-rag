import type { ScrapedDocument } from './types.ts';
import { isPdfUrl } from './utils.ts';

interface FirecrawlScrapeResponse {
  success: boolean;
  error?: string;
  warning?: string;
  data?: {
    markdown?: string;
    metadata?: {
      title?: string;
      sourceURL?: string;
      url?: string;
      contentType?: string;
      error?: string;
    };
  };
}

export async function scrapeDocumentToMarkdown(sourceUrl: string): Promise<ScrapedDocument> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error('FIRECRAWL_API_KEY is required');
  }

  const response = await fetch('https://api.firecrawl.dev/v2/scrape', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: sourceUrl,
      formats: ['markdown'],
      onlyMainContent: true,
      timeout: 120000,
      parsers: isPdfUrl(sourceUrl) ? ['pdf'] : undefined,
    }),
    signal: AbortSignal.timeout(130000),
  });

  const rawBody = await response.text();
  let payload: FirecrawlScrapeResponse | undefined;

  try {
    payload = JSON.parse(rawBody) as FirecrawlScrapeResponse;
  } catch {
    throw new Error(`Firecrawl returned a non-JSON response (${response.status})`);
  }

  if (!response.ok || !payload.success || !payload.data?.markdown) {
    const errorMessage =
      payload.data?.metadata?.error ?? payload.error ?? `Firecrawl request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  const title =
    payload.data.metadata?.title?.trim() ||
    payload.data.metadata?.url?.trim() ||
    sourceUrl;

  return {
    sourceUrl,
    title,
    markdown: payload.data.markdown,
    contentType: payload.data.metadata?.contentType,
  };
}
