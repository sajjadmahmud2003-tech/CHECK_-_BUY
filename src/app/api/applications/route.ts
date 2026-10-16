import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { dataStore, getApplications, createApplication } from '@/lib/data-store';
import { ApplicationDocumentType, OwnershipRelation } from '@/types';

// Module-scoped helper to resolve applications safely using dataStore or standalone function
function fetchApplications(filter?: Parameters<typeof getApplications>[0]) {
  if (typeof dataStore?.getApplications === 'function') {
    return dataStore.getApplications(filter);
  }
  return getApplications(filter);
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as any;
    const documentType = searchParams.get('documentType') || undefined;
    const search = searchParams.get('search') || undefined;

    // Citizens can ONLY view their own applications
    if (user.role === 'citizen') {
      const apps = fetchApplications({
        citizenId: user.id,
        status,
        documentType,
        search,
      });
      return NextResponse.json({ success: true, count: apps.length, applications: apps });
    }

    // Officers and Admins can view all applications in queue
    const apps = fetchApplications({
      officerId: user.role === 'officer' ? user.id : undefined,
      status,
      documentType,
      search,
    });

    return NextResponse.json({ success: true, count: apps.length, applications: apps });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Please log in to submit a land document application.' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Required fields validation
    const {
      citizenName,
      citizenPhone,
      citizenEmail,
      citizenNid,
      district,
      upazila,
      mouza,
      jlNumber,
      khatianNo,
      dagNo,
      ownershipRelation,
      documentType,
      purpose,
      additionalInfo,
      attachments,
    } = body;

    if (!citizenName?.trim() || !citizenPhone?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Validation Error: Full name and phone number are required.' },
        { status: 400 }
      );
    }

    if (!district?.trim() || !upazila?.trim() || !mouza?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Validation Error: District, Upazila, and Mouza are mandatory.' },
        { status: 400 }
      );
    }

    if (!khatianNo?.trim() || !dagNo?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Validation Error: Khatian Number and Dag/Plot Number are mandatory.' },
        { status: 400 }
      );
    }

    if (!documentType) {
      return NextResponse.json(
        { success: false, error: 'Validation Error: Requested document type must be specified.' },
        { status: 400 }
      );
    }

    if (!purpose?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Validation Error: Please state the purpose of this application.' },
        { status: 400 }
      );
    }

    // Check for recent duplicate submission by same citizen on same Dag & Khatian within 30 seconds
    const existing = fetchApplications({ citizenId: user.id });
    const isDuplicate = Array.isArray(existing) && existing.some(
      (a) =>
        a.dagNo === dagNo.trim() &&
        a.khatianNo === khatianNo.trim() &&
        a.documentType === documentType &&
        Date.now() - new Date(a.submittedAt).getTime() < 30000
    );

    if (isDuplicate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Duplicate application detected: An identical request was submitted moments ago. Please check My Applications.',
        },
        { status: 409 }
      );
    }

    // Create the application safely
    const payload = {
      citizenId: user.id,
      citizenName: citizenName.trim(),
      citizenPhone: citizenPhone.trim(),
      citizenEmail: citizenEmail?.trim() || user.email,
      citizenNid: citizenNid?.trim() || undefined,
      district: district.trim(),
      upazila: upazila.trim(),
      mouza: mouza.trim(),
      jlNumber: jlNumber?.trim() || undefined,
      khatianNo: khatianNo.trim(),
      dagNo: dagNo.trim(),
      ownershipRelation: (ownershipRelation as OwnershipRelation) || 'Owner',
      documentType: documentType as ApplicationDocumentType,
      purpose: purpose.trim(),
      additionalInfo: additionalInfo?.trim() || undefined,
      assignedOffice: `${upazila.trim()} AC Land Office & Sub-Registry Archive`,
    };

    const newApp = typeof dataStore?.createApplication === 'function'
      ? dataStore.createApplication(payload, attachments || [])
      : createApplication(payload, attachments || []);

    return NextResponse.json(
      {
        success: true,
        message: 'Land document application submitted successfully.',
        application: newApp,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
