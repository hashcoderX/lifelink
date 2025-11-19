import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, role } = body as { name?: string; email?: string; password?: string; role?: string };
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    const hashed = await hash(password, 10);
    const allowedRoles = ['DOCTOR', 'HOSPITAL', 'PATIENT', 'DONOR', 'FUND_RAISER'];
    const normalizedRole = typeof role === 'string'
      ? role.toUpperCase().replace(/[-\s]+/g, '_')
      : undefined;

    const user = await prisma.user.create({
      data: {
        email,
        name: name ?? null,
        hashedPassword: hashed,
        role: normalizedRole && allowedRoles.includes(normalizedRole) ? normalizedRole : 'GUEST',
      },
    });

    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
