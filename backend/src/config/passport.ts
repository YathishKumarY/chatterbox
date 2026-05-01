import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { randomBytes } from 'crypto';
import { env } from './env.js';
import { prisma } from './database.js';

function randomSuffix(len = 4) {
  return randomBytes(Math.ceil(len / 2)).toString('hex').slice(0, len);
}

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_CALLBACK_URL) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error('No email from Google'));

          let user = await prisma.user.findUnique({
            where: { provider_providerId: { provider: 'google', providerId: profile.id } },
          });

          if (!user) {
            const existingByEmail = await prisma.user.findUnique({ where: { email } });
            if (existingByEmail) {
              user = await prisma.user.update({
                where: { email },
                data: { provider: 'google', providerId: profile.id, avatarUrl: profile.photos?.[0]?.value ?? existingByEmail.avatarUrl },
              });
            } else {
              user = await prisma.user.create({
                data: {
                  email,
                  username: email.split('@')[0] + '_' + randomSuffix(4),
                  provider: 'google',
                  providerId: profile.id,
                  avatarUrl: profile.photos?.[0]?.value,
                },
              });
            }
          }

          done(null, user);
        } catch (err) {
          done(err as Error);
        }
      },
    ),
  );
}

if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET && env.GITHUB_CALLBACK_URL) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
        callbackURL: env.GITHUB_CALLBACK_URL,
      },
      async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
        try {
          const email = profile.emails?.[0]?.value || `${profile.username}@github.local`;

          let user = await prisma.user.findUnique({
            where: { provider_providerId: { provider: 'github', providerId: profile.id } },
          });

          if (!user) {
            user = await prisma.user.create({
              data: {
                email,
                username: profile.username || `gh_${profile.id}`,
                provider: 'github',
                providerId: profile.id,
                avatarUrl: profile.photos?.[0]?.value,
              },
            });
          }

          done(null, user);
        } catch (err) {
          done(err as Error);
        }
      },
    ),
  );
}

export default passport;
