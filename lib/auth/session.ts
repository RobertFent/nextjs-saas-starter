import { compare, hash } from 'bcryptjs';
import { JWTPayload, SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NewUser } from '../db/schema';

const key = new TextEncoder().encode(process.env.AUTH_SECRET);
const SALT_ROUNDS = 10;

export const hashPassword = async (password: string): Promise<string> => {
	return hash(password, SALT_ROUNDS);
};

export const comparePasswords = (
	plainTextPassword: string,
	hashedPassword: string
): Promise<boolean> => {
	return compare(plainTextPassword, hashedPassword);
};

interface SessionData {
	user: { id: number };
	expires: string;
}

export const signToken = async (payload: SessionData): Promise<string> => {
	// todo: verify
	return await new SignJWT(payload as unknown as JWTPayload)
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setExpirationTime('1 day from now')
		.sign(key);
};

export const verifyToken = async (input: string): Promise<SessionData> => {
	const { payload } = await jwtVerify(input, key, {
		algorithms: ['HS256']
	});
	return payload as unknown as SessionData;
};

export const getSession = async (): Promise<SessionData | null> => {
	const session = (await cookies()).get('session')?.value;
	if (!session) {
		return null;
	}
	return await verifyToken(session);
};

export const setSession = async (user: NewUser): Promise<void> => {
	const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);
	const session: SessionData = {
		user: { id: user.id! },
		expires: expiresInOneDay.toISOString()
	};
	const encryptedSession = await signToken(session);
	(await cookies()).set('session', encryptedSession, {
		expires: expiresInOneDay,
		httpOnly: true,
		secure: true,
		sameSite: 'lax'
	});
};
