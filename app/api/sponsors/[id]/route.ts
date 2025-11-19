import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();

    const response = await fetch(`${BACKEND_URL}/api/sponsors/${params.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating sponsor:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const response = await fetch(`${BACKEND_URL}/api/sponsors/${params.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to delete sponsor' }, { status: response.status });
    }

    return NextResponse.json({ message: 'Sponsor deleted successfully' });
  } catch (error) {
    console.error('Error deleting sponsor:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}