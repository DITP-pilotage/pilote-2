import { onlyCron } from "@/server/infrastructure/api/cron/onlyCron";
import {
  setupRequest,
  setupResponse,
} from "@/server/infrastructure/test/apiTestHelpers";

jest.mock("@/config", () => ({
  configuration: jest.fn(() => ({
    cron: {
      authSecret: "valid-secret",
    },
  })),
}));

describe("onlyCron", () => {
  it("doit retourner 405 quand la méthode n'est pas POST", async () => {
    // Given
    const request = setupRequest({ method: "GET" });
    const response = setupResponse();
    const handler = jest.fn();

    // When
    await onlyCron(handler)(request, response);

    // Then
    expect(response.status).toHaveBeenCalledWith(405);
    expect(response.status().json).toHaveBeenCalledWith({
      error: "Method not allowed",
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it("doit retourner 401 quand le header Authorization est absent", async () => {
    // Given
    const request = setupRequest({ headers: {} });
    const response = setupResponse();
    const handler = jest.fn();

    // When
    await onlyCron(handler)(request, response);

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
    const handler = jest.fn();

    // When
    await onlyCron(handler)(request, response);

    // Then
    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.status().json).toHaveBeenCalledWith({
      error: "Missing or invalid Authorization header",
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it("doit retourner 403 quand le secret est invalide", async () => {
    // Given
    const request = setupRequest({
      headers: { authorization: "Bearer invalid-secret" },
    });
    const response = setupResponse();
    const handler = jest.fn();

    // When
    await onlyCron(handler)(request, response);

    // Then
    expect(response.status).toHaveBeenCalledWith(403);
    expect(response.status().json).toHaveBeenCalledWith({
      error: "Invalid CRON authentication secret",
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it("doit appeler le handler quand l'authentification réussit", async () => {
    // Given
    const request = setupRequest({
      headers: { authorization: "Bearer valid-secret" },
    });
    const response = setupResponse();
    const handler = jest.fn();

    // When
    await onlyCron(handler)(request, response);

    // Then
    expect(handler).toHaveBeenCalledWith(request, response);
    expect(response.status).not.toHaveBeenCalled();
  });
});
