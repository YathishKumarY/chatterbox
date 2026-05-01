import { Router, Request, Response, NextFunction } from 'express';
import passport from '../config/passport.js';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import * as authService from '../services/auth.service.js';
import { env } from '../config/env.js';

const router = Router();

const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    username: z.string().min(3).max(30),
    password: z.string().min(6),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string(),
  }),
});

const refreshSchema = z.object({
  body: z.object({ refreshToken: z.string() }),
});

router.post('/register', validate(registerSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, username, password } = req.body;
    const result = await authService.register(email, username, password);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/login', validate(loginSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/refresh', validate(refreshSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.refreshToken(req.body.refreshToken);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_CALLBACK_URL) {
  router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

  router.get('/google/callback', (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('google', { session: false }, async (err: any, user: any) => {
      if (err) return next(err);
      if (!user) return res.redirect(`${env.CORS_ORIGIN}/login?error=auth_failed`);
      try {
        const tokens = await authService.findOrCreateOAuthUser(user);
        res.redirect(`${env.CORS_ORIGIN}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`);
      } catch (e) {
        next(e);
      }
    })(req, res, next);
  });
}

if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET && env.GITHUB_CALLBACK_URL) {
  router.get('/github', passport.authenticate('github', { scope: ['user:email'], session: false }));

  router.get('/github/callback', (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('github', { session: false }, async (err: any, user: any) => {
      if (err) return next(err);
      if (!user) return res.redirect(`${env.CORS_ORIGIN}/login?error=auth_failed`);
      try {
        const tokens = await authService.findOrCreateOAuthUser(user);
        res.redirect(`${env.CORS_ORIGIN}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`);
      } catch (e) {
        next(e);
      }
    })(req, res, next);
  });
}

export default router;
