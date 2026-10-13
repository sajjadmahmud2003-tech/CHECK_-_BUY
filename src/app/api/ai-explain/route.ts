import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/data-store';
import { generateAIExplanation } from '@/lib/ai-assistant';

export async function POST(request: Request) {
  try {
    const { recordId, verificationId } = await request.json();
    const record = dataStore.getRecordById(recordId);
    const verification = dataStore.getVerificationById(verificationId);

    if (!record || !verification) {
      return NextResponse.json({ success: false, error: 'Record or verification not found' }, { status: 404 });
    }

    const aiResult = await generateAIExplanation(record, verification);
    return NextResponse.json({ success: true, data: aiResult });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
