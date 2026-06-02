import { onlyAcmeApiKey } from "@/server/infrastructure/api/acme/onlyAcmeApiKey";
import {
  setupRequest,
  setupResponse,
} from "@/server/infrastructure/test/apiTestHelpers";

vi.mock("@/config", () => ({
  configuration: vi.fn(() => ({
    logLevel: "warn",
    acme: {
      uploadApiKey: "valid-secret",
    },
  })),
}));

describe("onlyAcmeApiKey", () => {
  it("doit retourner 405 quand la méthode n'est pas POST ou DELETE", async () => {
    // Given
    const request = setupRequest({ method: "GET" });
    const response = setupResponse();
    const handler = vi.fn();

    // When
    await onlyAcmeApiKey(handler)(request, response);

    // Then
    expect(response.status).toHaveBeenCalledWith(405);
    expect(response.status().json).toHaveBeenCalledWith({
      error: "Method not allowed",
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it("doit retourner 503 quand la clé API ACME n'est pas configurée", async () => {
    // Given
    const { configuration } = await import("@/config");
    vi.mocked(configuration).mockReturnValueOnce({
      logLevel: "warn",
      acme: { uploadApiKey: "" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    const request = setupRequest({
      headers: { authorization: "Bearer anything" },
    });
    const response = setupResponse();
    const handler = vi.fn();

    // When
    await onlyAcmeApiKey(handler)(request, response);

    // Then
    expect(response.status).toHaveBeenCalledWith(503);
    expect(response.status().json).toHaveBeenCalledWith({
      error: "ACME upload endpoint not configured",
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it("doit retourner 401 quand le header Authorization est absent", async () => {
    // Given
    const request = setupRequest({ headers: {} });
    const response = setupResponse();
    const handler = vi.fn();

    // When
    await onlyAcmeApiKey(handler)(request, response);

    // Then
    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.status().json).toHaveBeenCalledWith({
      error: "Missing or invalid Authorization header",
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it("doit retourner 401 quand le header Authorization ne commence pas par Bearer", async () => {
    // Given
    const request = setupRequest({
      headers: { authorization: "Basic some-token" },
    });
    const response = setupResponse();
    const handler = vi.fn();

    // When
    await onlyAcmeApiKey(handler)(request, response);

    // Then
    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.status().json).toHaveBeenCalledWith({
      error: "Missing or invalid Authorization header",
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it("doit retourner 403 quand la clé fournie est invalide", async () => {
    // Given
    const request = setupRequest({
      headers: { authorization: "Bearer invalid-secret" },
    });
    const response = setupResponse();
    const handler = vi.fn();

    // When
    await onlyAcmeApiKey(handler)(request, response);

    // Then
    expect(response.status).toHaveBeenCalledWith(403);
    expect(response.status().json).toHaveBeenCalledWith({
      error: "Invalid ACME API key",
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it("doit appeler le handler en POST quand l'authentification réussit", async () => {
    // Given
    const request = setupRequest({
      method: "POST",
      headers: { authorization: "Bearer valid-secret" },
    });
    const response = setupResponse();
    const handler = vi.fn();

    // When
    await onlyAcmeApiKey(handler)(request, response);

    // Then
    expect(handler).toHaveBeenCalledWith(request, response);
    expect(response.status).not.toHaveBeenCalled();
  });

  it("doit appeler le handler en DELETE quand l'authentification réussit", async () => {
    // Given
    const request = setupRequest({
      method: "DELETE",
      headers: { authorization: "Bearer valid-secret" },
    });
    const response = setupResponse();
    const handler = vi.fn();

    // When
    await onlyAcmeApiKey(handler)(request, response);

    // Then
    expect(handler).toHaveBeenCalledWith(request, response);
    expect(response.status).not.toHaveBeenCalled();
  });
});
