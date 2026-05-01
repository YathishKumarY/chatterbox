import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import { ConflictError, UnauthorizedError } from '../utils/errors.js';
import type { JwtPayload } from '../middleware/auth.js';

export async function register(email: string, username: string, password: string) {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) {
    throw new ConflictError(
      existing.email === email ? 'Email already registered' : 'Username already taken',
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, username, passwordHash },
    select: { id: true, email: true, username: true, avatarUrl: true, createdAt: true },
  });

  const tokens = generateTokens({ userId: user.id, email: user.email });
  return { user, ...tokens };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const tokens = generateTokens({ userId: user.id, email: user.email });
  return {
    user: { id: user.id, email: user.email, username: user.username, avatarUrl: user.avatarUrl },
    ...tokens,
  };
}

export async function refreshToken(token: string) {
  let payload: JwtPayload;
  try {
    payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
  } catch {
    throw new UnauthorizedError('Invalid refresh token');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) throw new UnauthorizedError('User not found');

  return generateTokens({ userId: user.id, email: user.email });
}

export function generateTokens(payload: JwtPayload) {
  const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRY as any });
  const refreshTokenValue = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY as any,
  });
  return { accessToken, refreshToken: refreshTokenValue };
}

export async function findOrCreateOAuthUser(user: any) {
  return generateTokens({ userId: user.id, email: user.email });
}
