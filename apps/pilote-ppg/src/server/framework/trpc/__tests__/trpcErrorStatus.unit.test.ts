import { TRPCError } from "@trpc/server";
import {
  httpStatusFromTrpcError,
  logLevelFromTrpcError,
} from "@/server/framework/trpc/trpcErrorStatus";
import { ConflictError } from "@/shared/errors/conflict-error";
import { PiloteError } from "@/shared/errors/pilote-error";

describe("httpStatusFromTrpcError", () => {
  it("retourne le statut porté par une erreur métier", () => {
    const error = new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      cause: new ConflictError("Un compte existe déjà."),
    });

    expect(httpStatusFromTrpcError(error)).toBe(409);
  });

  it("retourne le statut du code tRPC sinon", () => {
    expect(httpStatusFromTrpcError(new TRPCError({ code: "FORBIDDEN" }))).toBe(
      403,
    );
  });
});

describe("logLevelFromTrpcError", () => {
  it.each([
    {
      cas: "une erreur métier 4xx",
      error: new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        cause: new ConflictError("Un compte existe déjà."),
      }),
    },
    { cas: "un refus d'accès", error: new TRPCError({ code: "FORBIDDEN" }) },
    {
      cas: "une saisie invalide",
      error: new TRPCError({ code: "BAD_REQUEST" }),
    },
  ])("retourne warn pour $cas", ({ error }) => {
    expect(logLevelFromTrpcError(error)).toBe("warn");
  });

  it.each([
    {
      cas: "une erreur métier 5xx",
      error: new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        cause: new PiloteError({
          message: "Service indisponible",
          code: 503,
          type: "ServiceUnavailableError",
        }),
      }),
    },
    {
      cas: "une erreur inattendue",
      error: new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        cause: new Error("boom"),
      }),
    },
  ])("retourne error pour $cas", ({ error }) => {
    expect(logLevelFromTrpcError(error)).toBe("error");
  });
});
