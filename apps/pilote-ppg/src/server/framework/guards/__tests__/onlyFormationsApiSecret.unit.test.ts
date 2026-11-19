import { onlyFormationsApiSecret } from "@/server/framework/guards/onlyFormationsApiSecret";
import { setupRequest, setupResponse } from "@/test/apiTestHelpers";

const configurationTest = vi.hoisted(() => ({
  logLevel: "warn",
  formations: { apiSecret: "valid-secret" },
}));

vi.mock("@/config", () => ({
  configuration: vi.fn(() => configurationTest),
}));

describe("onlyFormationsApiSecret", () => {
  beforeEach(() => {
    configurationTest.formations.apiSecret = "valid-secret";
  });

  it("retourne 405 quand la méthode n'est pas PUT", async () => {
    // Given
    const request = setupRequest({
      method: "POST",
      headers: { authorization: "Bearer valid-secret" },
    });
    const response = setupResponse();
    const handler = vi.fn();

    // When
    await onlyFormationsApiSecret(handler)(request, response);

    // Then
    expect(response.status).toHaveBeenCalledWith(405);
    expect(response.status().json).toHaveBeenCalledWith({
      error: "Méthode non autorisée",
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it("retourne 503 quand le secret n'est pas configuré", async () => {
    // Given
    configurationTest.formations.apiSecret = "";
    const request = setupRequest({
      method: "PUT",
      headers: { authorization: "Bearer valid-secret" },
    });
    const response = setupResponse();
    const handler = vi.fn();

    // When
    await onlyFormationsApiSecret(handler)(request, response);

    // Then
    expect(response.status).toHaveBeenCalledWith(503);
    expect(response.status().json).toHaveBeenCalledWith({
      error: "Synchronisation des formations non configurée",
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it("retourne 401 quand le header Authorization est absent", async () => {
    // Given
    const request = setupRequest({ method: "PUT", headers: {} });
    const response = setupResponse();
    const handler = vi.fn();

    // When
    await onlyFormationsApiSecret(handler)(request, response);

    // Then
    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.status().json).toHaveBeenCalledWith({
      error: "Header Authorization absent ou invalide",
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it("retourne 401 quand le header Authorization ne commence pas par Bearer", async () => {
    // Given
    const request = setupRequest({
      method: "PUT",
      headers: { authorization: "Basic xyz" },
    });
    const response = setupResponse();
    const handler = vi.fn();

    // When
    await onlyFormationsApiSecret(handler)(request, response);

    // Then
    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.status().json).toHaveBeenCalledWith({
      error: "Header Authorization absent ou invalide",
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it("retourne 403 quand le secret est faux", async () => {
    // Given
    const request = setupRequest({
      method: "PUT",
      headers: { authorization: "Bearer invalid-secret" },
    });
    const response = setupResponse();
    const handler = vi.fn();

    // When
    await onlyFormationsApiSecret(handler)(request, response);

    // Then
    expect(response.status).toHaveBeenCalledWith(403);
    expect(response.status().json).toHaveBeenCalledWith({
      error: "Secret de synchronisation invalide",
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it("appelle le handler quand le secret est le bon", async () => {
    // Given
    const request = setupRequest({
      method: "PUT",
      headers: { authorization: "Bearer valid-secret" },
    });
    const response = setupResponse();
    const handler = vi.fn();

    // When
    await onlyFormationsApiSecret(handler)(request, response);

    // Then
    expect(handler).toHaveBeenCalledWith(request, response);
    expect(response.status).not.toHaveBeenCalled();
  });
});
