import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/data-store';
import { SearchFilters } from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const district = searchParams.get('district') || undefined;
    const upazila = searchParams.get('upazila') || undefined;
    const mouza = searchParams.get('mouza') || undefined;
    const dagNo = searchParams.get('dagNo') || undefined;
    const khatianNo = searchParams.get('khatianNo') || undefined;
    const statusFilter = (searchParams.get('status') as any) || undefined;

    const filters: SearchFilters = {
      district: district !== 'all' ? district : undefined,
      upazila,
      mouza,
      dagNo,
      khatianNo,
      statusFilter,
    };

    const results = dataStore.getRecords(filters);
    return NextResponse.json({ success: true, count: results.length, data: results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const results = dataStore.getRecords(body);
    return NextResponse.json({ success: true, count: results.length, data: results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
