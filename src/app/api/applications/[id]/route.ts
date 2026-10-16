import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { dataStore, getApplicationById, updateApplicationStatus } from '@/lib/data-store';
import { ApplicationStatus } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required.' },
        { status: 401 }
      );
    }

    const app = typeof dataStore?.getApplicationById === 'function'
      ? dataStore.getApplicationById(id)
      : getApplicationById(id);
    if (!app) {
      return NextResponse.json(
        { success: false, error: `Application '${id}' was not found.` },
        { status: 404 }
      );
    }

    // Strict Ownership / IDOR Defense:
    // A Citizen can ONLY view their own application
    if (user.role === 'citizen' && app.citizenId !== user.id) {
      dataStore.logAction(
        'SECURITY_ALERT_IDOR_ATTEMPT',
        'application',
        id,
        `Citizen ${user.fullName} (${user.id}) attempted to access application owned by ${app.citizenId}`,
        user.id
      );

      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden: You do not have permission to view another citizen’s application.',
          code: 'IDOR_FORBIDDEN',
        },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, application: app });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required.' },
        { status: 401 }
      );
    }

    // Strict Authorization: Citizens CANNOT approve, reject, or change status
    if (user.role === 'citizen') {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden: Citizens are not authorized to update application statuses or approve applications.',
          code: 'ROLE_FORBIDDEN',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { newStatus, reason, officerMessage, correctionInstructions, internalNotes } = body;

    const allowedStatuses: ApplicationStatus[] = [
      'Under_Review',
      'Correction_Required',
      'Approved',
      'Rejected',
      'Document_Available',
    ];

    if (!newStatus || !allowedStatuses.includes(newStatus)) {
      return NextResponse.json(
        { success: false, error: `Invalid status '${newStatus}'. Allowed: ${allowedStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Require written justification for rejection or correction
    if (newStatus === 'Rejected' && !reason?.trim()) {
      return NextResponse.json(
        { success: false, error: 'A written rejection reason is mandatory when rejecting an application.' },
        { status: 400 }
      );
    }

    if (newStatus === 'Correction_Required' && !correctionInstructions?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Correction instructions are required so the citizen knows what to resubmit.' },
        { status: 400 }
      );
    }

    const updateFn = typeof dataStore?.updateApplicationStatus === 'function'
      ? dataStore.updateApplicationStatus.bind(dataStore)
      : updateApplicationStatus;

    const updated = updateFn(
      id,
      newStatus,
      user.id,
      user.fullName,
      {
        reason,
        officerMessage,
        correctionInstructions,
        internalNotes,
      }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: `Application '${id}' was not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Application status updated to '${newStatus}'.`,
      application: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
