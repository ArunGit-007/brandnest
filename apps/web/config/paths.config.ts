import { z } from 'zod';

const PathsSchema = z.object({
  auth: z.object({
    signIn: z.string().min(1),
    signUp: z.string().min(1),
    verifyMfa: z.string().min(1),
    callback: z.string().min(1),
    passwordReset: z.string().min(1),
    passwordUpdate: z.string().min(1),
  }),
  app: z.object({
    home: z.string().min(1),
    profileSettings: z.string().min(1),
    brands: z.string().min(1),
    brandDashboard: z.string().min(1),
    brandContent: z.string().min(1),
    brandContentNew: z.string().min(1),
    brandSocial: z.string().min(1),
    brandAnalytics: z.string().min(1),
    brandSettings: z.string().min(1),
  }),
});

const pathsConfig = PathsSchema.parse({
  auth: {
    signIn: '/auth/sign-in',
    signUp: '/auth/sign-up',
    verifyMfa: '/auth/verify',
    callback: '/auth/callback',
    passwordReset: '/auth/password-reset',
    passwordUpdate: '/update-password',
  },
  app: {
    home: '/home',
    profileSettings: '/home/settings',
    brands: '/home',
    brandDashboard: '/home/brands/[brandSlug]',
    brandContent: '/home/brands/[brandSlug]/content',
    brandContentNew: '/home/brands/[brandSlug]/content/new',
    brandSocial: '/home/brands/[brandSlug]/social',
    brandAnalytics: '/home/brands/[brandSlug]/analytics',
    brandSettings: '/home/brands/[brandSlug]/settings',
  },
} satisfies z.infer<typeof PathsSchema>);

export default pathsConfig;
