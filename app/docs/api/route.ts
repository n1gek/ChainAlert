// Documents API Route - Firestore Only (No Storage)
import { NextRequest, NextResponse } from 'next/server';
import { documentDB } from '@/app/lib/database';

export const dynamic = 'force-dynamic';

// GET - Fetch user's documents
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const documents = await documentDB.getUserDocuments(userId, type || undefined);
    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST - Save document metadata (NO FILE UPLOAD - Firestore only)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const typeValue = formData.get('type') as string;
    const category = formData.get('category') as string;
    const description = formData.get('description') as string;
    const accessLevelValue = formData.get('accessLevel') as string;
    const isEncrypted = formData.get('isEncrypted') === 'true';

    // Validate document type
    const validTypes = ['id', 'evidence', 'legal', 'medical', 'other'];
    const type = validTypes.includes(typeValue) ? (typeValue as 'id' | 'evidence' | 'legal' | 'medical' | 'other') : 'other';

    // Map access level to valid values
    const accessLevelMap: { [key: string]: 'private' | 'shared' | 'public' } = {
      'public': 'public',
      'contacts': 'shared',
      'legal_only': 'shared',
      'private': 'private'
    };
    const accessLevel = accessLevelMap[accessLevelValue] || 'private';

    if (!file || !userId) {
      return NextResponse.json(
        { error: 'File and user ID are required' },
        { status: 400 }
      );
    }

    // Generate metadata (no actual file upload)
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `documents/${userId}/${timestamp}_${sanitizedFileName}`;

    // Save ONLY metadata to Firestore (FREE tier)
    const documentId = await documentDB.addDocument(userId, {
      name: file.name,
      type,
      category,
      size: file.size,
      storagePath, // Reference path (file not actually stored)
      mimeType: file.type,
      accessLevel,
      isEncrypted,
      description,
      tags: [],
      expirationDate: null,
      status: 'pending',
      verifiedAt: null
    });

    return NextResponse.json({
      success: true,
      documentId,
      message: 'Document metadata saved successfully',
      note: 'File upload disabled - metadata only mode'
    });
  } catch (error) {
    console.error('Error saving document metadata:', error);
    return NextResponse.json(
      { error: 'Failed to save document metadata', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE - Delete document metadata
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Delete metadata from Firestore (no file to delete)
    await documentDB.deleteDocument(documentId);

    return NextResponse.json({
      success: true,
      message: 'Document metadata deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document', details: (error as Error).message },
      { status: 500 }
    );
  }
}
