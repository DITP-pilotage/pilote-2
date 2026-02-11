import { endpointProtege } from "@/server/app/error-boundary/endpoint-protege";
import {
  setupRequest,
  setupResponse,
} from "@/server/infrastructure/test/apiTestHelpers";
import { BadRequestError } from "@/server/app/error-boundary/bad-request-error";
import { PiloteError } from "@/server/app/error-boundary/pilote-error";
import Logger from "@/server/infrastructure/Logger";

const { MockTokenAPIJWTService } = vi.hoisted(() => ({
  MockTokenAPIJWTService: vi.fn(),
}));

vi.mock("@/config", () => ({
  configuration: vi.fn(() => ({
    tokenAPI: {
      secret: "test-secret",
    },
  })),
}));

vi.mock("@/server/infrastructure/Logger", () => ({
  __esModule: true,
  default: {
    error: vi.fn(),
  },
}));

vi.mock(
  "@/server/authentification/infrastructure/adapters/services/TokenAPIJWTService",
  () => ({ TokenAPIJWTService: MockTokenAPIJWTService }),
);

const mockLoggerError = Logger.error as ReturnType<typeof vi.fn>;

describe("endpointProtege", () => {
  let mockDecoderTokenAPI: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLoggerError.mockClear();
    mockDecoderTokenAPI = vi.fn();
    MockTokenAPIJWTService.mockImplementation(function () {
      return {
        decoderTokenAPI: mockDecoderTokenAPI,
      };
    });
  });

  describe("Authentication", () => {
    it("doit retourner 401 quand le header Authorization est absent", async () => {
      // Given
      const request = setupRequest({ headers: {} });
      const response = setupResponse();
      const handler = vi.fn();

      // When
      await endpointProtege(handler)(request, response);

      // Then
      expect(response.status).toHaveBeenCalledWith(401);
      expect(response.status().json).toHaveBeenCalledWith({
        success: false,
        message: "Il vous manque le header Authorization avec le token API",
      });
      expect(handler).not.toHaveBeenCalled();
      expect(mockLoggerError).toHaveBeenCalledWith(
        "(API) Une erreur est survenue",
        "UnauthorizedError",
        "Il vous manque le header Authorization avec le token API",
      );
    });

    it("doit retourner 400 quand le header Authorization ne commence pas par Bearer", async () => {
      // Given
      const request = setupRequest({
        headers: { authorization: "Basic some-token" },
      });
      const response = setupResponse();
      const handler = vi.fn();

      // When
      await endpointProtege(handler)(request, response);

      // Then
      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.status().json).toHaveBeenCalledWith({
        success: false,
        message: "Le token n'existe pas dans le header Authorization",
      });
      expect(handler).not.toHaveBeenCalled();
      expect(mockLoggerError).toHaveBeenCalledWith(
        "(API) Une erreur est survenue",
        "BadRequestError",
        "Le token n'existe pas dans le header Authorization",
      );
    });

    it("doit retourner 400 quand le format du header Authorization est invalide", async () => {
      // Given
      const request = setupRequest({
        headers: { authorization: "Bearer" },
      });
      const response = setupResponse();
      const handler = vi.fn();

      // When
      await endpointProtege(handler)(request, response);

      // Then
      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.status().json).toHaveBeenCalledWith({
        success: false,
        message: "Le token n'existe pas dans le header Authorization",
      });
      expect(handler).not.toHaveBeenCalled();
    });

    it("doit retourner 400 quand le token JWT ne peut pas être décodé", async () => {
      // Given
      const request = setupRequest({
        headers: { authorization: "Bearer invalid-token" },
      });
      const response = setupResponse();
      const handler = vi.fn();
      mockDecoderTokenAPI.mockRejectedValue(
        new BadRequestError(
          "Le token n'a pas pu être décodé, veuillez vérifier qu'il est conforme au format JWT",
        ),
      );

      // When
      await endpointProtege(handler)(request, response);

      // Then
      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.status().json).toHaveBeenCalledWith({
        success: false,
        message:
          "Le token n'a pas pu être décodé, veuillez vérifier qu'il est conforme au format JWT",
      });
      expect(handler).not.toHaveBeenCalled();
      expect(mockDecoderTokenAPI).toHaveBeenCalledWith("invalid-token");
    });
  });

  describe("Handler execution", () => {
    it("doit appeler le handler quand l'authentification réussit", async () => {
      // Given
      const request = setupRequest({
        headers: { authorization: "Bearer valid-token" },
      });
      const response = setupResponse();
      const handler = vi.fn();
      mockDecoderTokenAPI.mockResolvedValue({
        email: "test@example.com",
      });

      // When
      await endpointProtege(handler)(request, response);

      // Then
      expect(handler).toHaveBeenCalledWith(request, response);
      expect(response.status).not.toHaveBeenCalled();
      expect(mockDecoderTokenAPI).toHaveBeenCalledWith("valid-token");
    });

    it("doit appeler tous les handlers dans l'ordre quand l'authentification réussit", async () => {
      // Given
      const request = setupRequest({
        headers: { authorization: "Bearer valid-token" },
      });
      const response = setupResponse();
      const callOrder: number[] = [];
      const handler1 = vi.fn(async () => {
        callOrder.push(1);
      });
      const handler2 = vi.fn(async () => {
        callOrder.push(2);
      });
      const handler3 = vi.fn(async () => {
        callOrder.push(3);
      });
      mockDecoderTokenAPI.mockResolvedValue({
        email: "test@example.com",
      });

      // When
      await endpointProtege(handler1, handler2, handler3)(request, response);

      // Then
      expect(handler1).toHaveBeenCalledWith(request, response);
      expect(handler2).toHaveBeenCalledWith(request, response);
      expect(handler3).toHaveBeenCalledWith(request, response);
      expect(callOrder).toEqual([1, 2, 3]);
      expect(response.status).not.toHaveBeenCalled();
    });
  });

  describe("Error handling", () => {
    it("doit retourner le status et le message de l'erreur quand un handler lance une PiloteError", async () => {
      // Given
      const request = setupRequest({
        headers: { authorization: "Bearer valid-token" },
      });
      const response = setupResponse();
      const error = new PiloteError({
        message: "Une erreur métier est survenue",
        code: 422,
        type: "BusinessError",
      });
      const handler = vi.fn().mockRejectedValue(error);
      mockDecoderTokenAPI.mockResolvedValue({
        email: "test@example.com",
      });

      // When
      await endpointProtege(handler)(request, response);

      // Then
      expect(response.status).toHaveBeenCalledWith(422);
      expect(response.status().json).toHaveBeenCalledWith({
        success: false,
        message: "Une erreur métier est survenue",
      });
      expect(mockLoggerError).toHaveBeenCalledWith(
        "(API) Une erreur est survenue",
        "BusinessError",
        "Une erreur métier est survenue",
      );
    });

    it("doit retourner 500 avec un message générique quand un handler lance une erreur non-PiloteError", async () => {
      // Given
      const request = setupRequest({
        headers: { authorization: "Bearer valid-token" },
      });
      const response = setupResponse();
      const error = new Error("Une erreur technique inattendue");
      const handler = vi.fn().mockRejectedValue(error);
      mockDecoderTokenAPI.mockResolvedValue({
        email: "test@example.com",
      });

      // When
      await endpointProtege(handler)(request, response);

      // Then
      expect(response.status).toHaveBeenCalledWith(500);
      expect(response.status().json).toHaveBeenCalledWith({
        success: false,
        message:
          "Une erreur est survenue, veuillez contacter le support pour plus d'information",
      });
      expect(mockLoggerError).toHaveBeenCalledWith(
        "(API) Une erreur interne est survenue : Une erreur technique inattendue",
      );
    });
  });
});
