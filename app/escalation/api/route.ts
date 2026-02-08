
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ message: 'Escalation GET endpoint' });
}

export async function POST() {
  return NextResponse.json({ message: 'Escalation POST endpoint' });
}
