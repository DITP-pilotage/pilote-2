import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { type CreateNextContextOptions } from "@trpc/server/adapters/next";
import { getServerAuthSession } from "@/server/infrastructure/api/auth/[...nextauth]";
import { NonAutorisé } from "@/server/utils/errors";
import { PiloteError } from "@/server/app/error-boundary/pilote-error";
import { CreateContextOptions } from "./trpc.interface";

const créerContextTRPCInterne = (opts: CreateContextOptions) => {
  return {
    session: opts.session,
    csrfDuCookie: opts.csrfDuCookie,
  };
};

export const créerContextTRPC = async (opts: CreateNextContextOptions) => {
  const { req, res } = opts;

  const session = await getServerAuthSession({ req, res });
  const csrfDuCookie = req.cookies.csrf ?? null;

  return créerContextTRPCInterne({
    session,
    csrfDuCookie,
  });
};

// Helper functions pour détecter les types d'erreurs de manière robuste
const isPiloteError = (error: unknown): error is PiloteError => {
  return (
    error instanceof PiloteError ||
    (typeof error === "object" &&
      error !== null &&
      "status" in error &&
      "type" in error &&
      typeof (error as Record<string, unknown>).status === "number" &&
      typeof (error as Record<string, unknown>).type === "string")
  );
};

const isNonAutorisé = (error: unknown): error is NonAutorisé => {
  return (
    error instanceof NonAutorisé ||
    (error instanceof Error && error.constructor.name === "NonAutorisé")
  );
};

const trpc = initTRPC.context<typeof créerContextTRPC>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    const formattedData = { ...shape.data };
    delete formattedData.stack;
    const isInternalServerError =
      !isNonAutorisé(error.cause) && !isPiloteError(error.cause);
    return {
      ...shape,
      message: isInternalServerError
        ? "Une erreur est survenue"
        : shape.message,
      data: {
        ...formattedData,
        httpStatus: isInternalServerError
          ? 500
          : isPiloteError(error.cause)
            ? error.cause.status
            : 403,
        code: isInternalServerError
          ? "INTERNAL_SERVER_ERROR"
          : isPiloteError(error.cause)
            ? error.cause.type
            : "UNAUTHORIZED",
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

const vérifierSiUtilisateurEstConnectéTRPCMiddleware = trpc.middleware(
  ({ ctx, next }) => {
    if (!ctx.session || !ctx.session.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    return next({
      ctx: {
        session: { ...ctx.session, user: ctx.session.user },
      },
    });
  },
);

export const vérifierSiLeCSRFEstValide = (
  csrfDuCookie: string | null,
  csrfDuBody: string,
) => {
  if (!csrfDuCookie || !csrfDuBody) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "Le cookie CSRF n'existe pas ou il n'est pas correctement soumis",
    });
  }

  if (csrfDuCookie !== csrfDuBody) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Le CSRF est invalide" });
  }
};

export const créerRouteurTRPC = trpc.router;
export const procédureProtégée = trpc.procedure.use(
  vérifierSiUtilisateurEstConnectéTRPCMiddleware,
);
