import { NextResponse } from 'next/server';
import { parseBanglaLandText } from '@/lib/ocr-service';

export async function POST(request: Request) {
  try {
    const { rawText } = await request.json();
    if (!rawText) {
      return NextResponse.json({ success: false, error: 'rawText is required' }, { status: 400 });
    }

    const extracted = parseBanglaLandText(rawText);
    return NextResponse.json({ success: true, data: extracted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
