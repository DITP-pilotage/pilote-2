import { type inferRouterInputs, type inferRouterOutputs } from "@trpc/server";
import { type Session } from "next-auth";
import { appRouter } from "@/server/infrastructure/api/trpc/routes/routes";

export type AppRouter = typeof appRouter;
export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
export type CreateContextOptions = {
  session: Session | null;
  csrfDuCookie: string | null;
};
