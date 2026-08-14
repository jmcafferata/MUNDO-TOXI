/**
 * Vercel Web Analytics
 * Initializes and configures Vercel Web Analytics for the application.
 * https://vercel.com/docs/analytics
 */
import { inject } from '@vercel/analytics';

// Initialize Vercel Web Analytics
inject({
  mode: 'auto',
  debug: false
});
