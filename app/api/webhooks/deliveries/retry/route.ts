import { NextRequest, NextResponse } from 'next/server';
import { MongoDatabase } from '../../../../../lib/server/database/MongoDatabase';
import { webhookService } from '../../../../../lib/services/WebhookService';

let db: MongoDatabase | null = null;
let initPromise: Promise<MongoDatabase> | null = null;

async function ensureDb() {
  if (db) return db;
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const instance = MongoDatabase.getInstance();
    await instance.initialize();
    db = instance;
    return instance;
  })();
  return initPromise;
}

// POST /api/webhooks/deliveries/retry
export async function POST(request: NextRequest) {
  try {
    const { deliveryId } = await request.json();
    if (!deliveryId) {
      return NextResponse.json({ success: false, error: 'deliveryId is required' }, { status: 400 });
    }

    const database = await ensureDb();
    if (!database.isHealthy()) {
      return NextResponse.json({ success: false, error: 'Database not ready' }, { status: 503 });
    }

    // Minimal placeholder: load last delivery (payload/config) and resend
    // In production, fetch from DB tables; here we return success to wire UI
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error retrying delivery:', error);
    return NextResponse.json({ success: false, error: 'Failed to retry delivery' }, { status: 500 });
  }
}


