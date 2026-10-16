import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { dataStore, getApplicationById, uploadOfficialDocument } from '@/lib/data-store';
import { savePrivateDocument, validateFileMetadata } from '@/lib/document-storage';

export async function POST(
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

    // Strict Authorization: Citizens CANNOT upload official certified documents
    if (user.role === 'citizen') {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden: Only authorized Land Officers or Administrators may upload certified documents.',
          code: 'ROLE_FORBIDDEN',
        },
        { status: 403 }
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

    // Application must have reached approval before final document release
    if (app.status !== 'Approved' && app.status !== 'Document_Available') {
      return NextResponse.json(
        {
          success: false,
          error: `Document upload rejected: Application must be 'Approved' before an official document can be uploaded (current status: ${app.status}).`,
        },
        { status: 400 }
      );
    }

    // Process multipart/form-data upload
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file was provided in the upload request.' },
        { status: 400 }
      );
    }

    // Strict server-side validation: MUST be application/pdf
    const mimeType = file.type || 'application/pdf';
    const validation = validateFileMetadata(mimeType, file.size, file.name);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { success: false, error: 'Only PDF format is permitted for official certified documents.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save into private storage (outside public directory, with random UUID key)
    const stored = await savePrivateDocument(buffer, file.name, 'application/pdf');

    // Register official document in data store
    const uploadFn = typeof dataStore?.uploadOfficialDocument === 'function'
      ? dataStore.uploadOfficialDocument.bind(dataStore)
      : uploadOfficialDocument;

    const officialDoc = uploadFn(app.id, {
      applicationId: app.id,
      storageKey: stored.storageKey,
      fileName: stored.originalName,
      fileSize: stored.sizeBytes,
      uploadedBy: user.id,
      uploaderName: user.fullName,
      verificationHash: `BD-ACLAND-${app.applicationNumber}-${Date.now().toString(36).toUpperCase()}`,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Official certified PDF uploaded and registered successfully. Document is now available to the citizen.',
        officialDocument: officialDoc,
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
