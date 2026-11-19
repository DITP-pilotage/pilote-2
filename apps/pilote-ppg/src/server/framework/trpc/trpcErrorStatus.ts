import type { TRPCError } from "@trpc/server";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";
import { PiloteError } from "@/shared/errors/pilote-error";

export const httpStatusFromTrpcError = (error: TRPCError): number =>
  PiloteError.isPiloteError(error.cause)
    ? error.cause.status
    : getHTTPStatusCodeFromError(error);

export const logLevelFromTrpcError = (error: TRPCError): "warn" | "error" =>
  httpStatusFromTrpcError(error) < 500 ? "warn" : "error";
