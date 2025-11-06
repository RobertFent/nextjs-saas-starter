import { withApiAuthAndTryCatch } from '@/lib/auth/middleware';
import { User } from '@/lib/db/schema';
import { NextResponse } from 'next/server';

export const GET = withApiAuthAndTryCatch<[Request], User>(
	async (user, _req) => {
		return NextResponse.json(user, { status: 200 });
	}
);
