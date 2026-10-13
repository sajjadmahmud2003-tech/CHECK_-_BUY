import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/data-store';
import { analyzeLandRecordRisks } from '@/lib/risk-engine';

export async function POST(request: Request) {
  try {
    const { recordId, userId } = await request.json();
    if (!recordId) {
      return NextResponse.json({ success: false, error: 'recordId is required' }, { status: 400 });
    }

    const record = dataStore.getRecordById(recordId);
    if (!record) {
      return NextResponse.json({ success: false, error: 'Land record not found' }, { status: 404 });
    }

    const verification = dataStore.createVerification(record, userId);
    return NextResponse.json({ success: true, data: verification });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
