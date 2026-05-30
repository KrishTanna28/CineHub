import { withCronAuth } from '@/lib/middleware/withAuth.js';
import { success, error } from '@/lib/utils/apiResponse.js';
import { runIngestion } from '@/lib/services/ingestion/pineconeIngestion.js';

export const runtime = 'nodejs';

async function handler(request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') === 'full' ? 'full' : 'delta';
    const lookbackHours = Number(searchParams.get('lookbackHours') || process.env.INGEST_LOOKBACK_HOURS || 24);

    const result = await runIngestion({ mode, lookbackHours });
    return success(result);
  } catch (err) {
    console.error('[API Error] Cron ingest:', err);
    return error(err?.message || 'Ingestion failed', 500);
  }
}

export const GET = withCronAuth(handler);
