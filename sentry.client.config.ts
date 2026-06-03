import * as Sentry from '@sentry/nextjs';

Sentry.init({
  // DSN is read from SENTRY_DSN env variable (or NEXT_PUBLIC_SENTRY_DSN for client)
  // If not set, Sentry will be effectively disabled (no-op)
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || '',

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 0.1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry
  debug: false,

  // Only enable in production
  enabled: process.env.NODE_ENV === 'production',

  replaysOnErrorSampleRate: 1.0,

  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  integrations: [
    Sentry.replayIntegration({
      // Additional Replay configuration goes in here, for example:
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
