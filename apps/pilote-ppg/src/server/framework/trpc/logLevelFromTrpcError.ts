import type { TRPCError } from "@trpc/server";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";
import { PiloteError } from "@/shared/errors/pilote-error";

export const logLevelFromTrpcError = (error: TRPCError): "warn" | "error" => {
  const status = PiloteError.isPiloteError(error.cause)
    ? error.cause.status
    : getHTTPStatusCodeFromError(error);
  return status < 500 ? "warn" : "error";
};
