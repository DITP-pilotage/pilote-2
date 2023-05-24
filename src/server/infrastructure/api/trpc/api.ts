import { loggerLink, httpBatchLink } from '@trpc/client';
import { createTRPCNext } from '@trpc/next';
import superjson from 'superjson';
import { AppRouter } from './trpc.interface';

const récupérerBaseUrl = () => {
  if (typeof window !== 'undefined') 
    return '';

  if (process.env.NEXTAUTH_URL) 
    return `https://${process.env.NEXTAUTH_URL}`;

  return `http://localhost:${process.env.PORT ?? 3000}`;
};

const api = createTRPCNext<AppRouter>({
  config({ ctx }) {
    return {
      transformer: superjson,
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === 'development' ||
            (opts.direction === 'down' && opts.result instanceof Error),
        }),
        httpBatchLink({
          url: `${récupérerBaseUrl()}/api/trpc`,
          maxURLLength: 6000,
        }),
      ],
      headers() {
        if (ctx?.req) {
          return {
            ...ctx.req.headers,
            'x-ssr': '1',
          };
        }
      },
    };
  },
});

export default api;
