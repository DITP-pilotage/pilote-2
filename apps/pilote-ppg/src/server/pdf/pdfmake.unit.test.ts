import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { pdfmake } from "@/server/pdf/pdfmake";

describe("pdfmake", () => {
  let serveur: Server;
  let requetesRecues: number;

  beforeEach(async () => {
    requetesRecues = 0;
    serveur = createServer((_requete, reponse) => {
      requetesRecues += 1;
      reponse.statusCode = 404;
      reponse.end();
    });
    await new Promise<void>((resolve) =>
      serveur.listen(0, "127.0.0.1", resolve),
    );
  });

  afterEach(async () => {
    await new Promise((resolve) => serveur.close(resolve));
  });

  it("refuse de télécharger une ressource désignée par une URL", async () => {
    const { port } = serveur.address() as AddressInfo;
    const document = {
      content: [{ image: "logo" }],
      images: { logo: `http://127.0.0.1:${port}/logo.png` },
    };

    await expect(pdfmake.createPdf(document).getBuffer()).rejects.toThrow(
      "Access to URL denied by resource access policy",
    );
    expect(requetesRecues).toBe(0);
  });
});
