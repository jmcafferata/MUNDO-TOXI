// Vercel Web Analytics initialization
import { inject } from '@vercel/analytics';

// Initialize analytics for production and development
inject({
  mode: import.meta.env.MODE === 'development' ? 'development' : 'production'
});

export {}; // keep module scope
