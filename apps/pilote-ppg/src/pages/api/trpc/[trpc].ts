import { createNextApiHandler } from "@trpc/server/adapters/next";

import { appRouter } from "@/server/app/trpc/appRouter";
import { logger } from "@/server/framework/logger";
import { createTRPCContext } from "@/server/framework/trpc/trpc";
import { categorieDepuisRouteurTRPC } from "@/server/framework/trpc/categorieLogRouteurTRPC";

export default createNextApiHandler({
  router: appRouter,
  createContext: createTRPCContext,
  onError: ({ error, ctx, path, input }) =>
    logger.error(
      {
        categorie: categorieDepuisRouteurTRPC(path),
        source: "trpc",
        type: error.name,
        path: path,
        input: input as Record<string, unknown>,
        utilisateur: ctx?.session?.user.email,
      },
      error.message,
    ),
});
