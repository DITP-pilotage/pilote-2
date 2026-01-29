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

const trpc = initTRPC.context<typeof créerContextTRPC>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    const formattedData = { ...shape.data };
    delete formattedData.stack;
    const isInternalServerError =
      !NonAutorisé.isNonAutorisé(error.cause) &&
      !PiloteError.isPiloteError(error.cause);
    return {
      ...shape,
      message: isInternalServerError
        ? "Une erreur est survenue"
        : shape.message,
      data: {
        ...formattedData,
        httpStatus: isInternalServerError
          ? 500
          : PiloteError.isPiloteError(error.cause)
            ? error.cause.status
            : 403,
        code: isInternalServerError
          ? "INTERNAL_SERVER_ERROR"
          : PiloteError.isPiloteError(error.cause)
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
export const procédureNonConnecte = trpc.procedure;
