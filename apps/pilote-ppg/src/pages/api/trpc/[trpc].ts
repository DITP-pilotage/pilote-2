import { createNextApiHandler } from "@trpc/server/adapters/next";

import { appRouter } from "@/server/infrastructure/api/trpc/routes/routes";
import logger from "@/server/infrastructure/Logger";
import { créerContextTRPC } from "@/server/infrastructure/api/trpc/trpc";

export default createNextApiHandler({
  router: appRouter,
  createContext: créerContextTRPC,
  onError: ({ error, ctx, path, input }) =>
    logger.error(
      {
        categorie: "systeme",
        source: "trpc",
        type: error.name,
        path: path,
        input: input as Record<string, unknown>,
        utilisateur: ctx?.session?.user.email,
      },
      error.message,
    ),
});
