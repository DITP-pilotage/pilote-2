import { onlyPost } from "@/server/framework/guards/onlyPost";
import { setupRequest, setupResponse } from "@/test/apiTestHelpers";

describe("onlyPost", () => {
  it.each(["GET", "HEAD", "PUT", "DELETE"])(
    "doit retourner 405 pour une requête %s",
    async (method) => {
      // Given
      const request = setupRequest({ method });
      const response = setupResponse();
      const handler = vi.fn();

      // When
      await onlyPost(handler)(request, response);

      // Then
      expect(response.status).toHaveBeenCalledWith(405);
      expect(response.status().json).toHaveBeenCalledWith({
        error: "Méthode non autorisée",
      });
      expect(handler).not.toHaveBeenCalled();
    },
  );

  it("doit appeler le handler pour une requête POST", async () => {
    // Given
    const request = setupRequest({ method: "POST" });
    const response = setupResponse();
    const handler = vi.fn();

    // When
    await onlyPost(handler)(request, response);

    // Then
    expect(handler).toHaveBeenCalledWith(request, response);
    expect(response.status).not.toHaveBeenCalled();
  });
});
