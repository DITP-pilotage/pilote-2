import { QueryClient } from "@tanstack/react-query";
import { loggerLink, httpBatchLink, TRPCClientError } from "@trpc/client";
import { createTRPCNext } from "@trpc/next";
import superjson from "superjson";
import { AppRouter } from "./trpc.interface";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (
          error instanceof TRPCClientError &&
          error?.data?.code === "UNAUTHORIZED"
        ) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

const récupérerBaseUrl = () => {
  if (typeof window !== "undefined") return "";

  if (process.env.NEXTAUTH_URL) return `https://${process.env.NEXTAUTH_URL}`;

  return `http://localhost:${process.env.PORT ?? 3000}`;
};

const api = createTRPCNext<AppRouter>({
  transformer: superjson,
  config({ ctx }) {
    return {
      queryClient,
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === "development" ||
            (opts.direction === "down" && opts.result instanceof Error),
        }),
        httpBatchLink({
          url: `${récupérerBaseUrl()}/api/trpc`,
          maxURLLength: 6000,
          transformer: superjson,
          headers() {
            if (ctx?.req) {
              return {
                ...ctx.req.headers,
                "x-ssr": "1",
              };
            }
            return {};
          },
        }),
      ],
    };
  },
});

export default api;
