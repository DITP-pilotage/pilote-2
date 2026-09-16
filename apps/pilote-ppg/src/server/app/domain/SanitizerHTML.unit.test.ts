import { SanitizerHTML } from "@/server/app/domain/SanitizerHTML";

describe("SanitizerHTML", () => {
  it("Doit conserver le data-src d'un bloc vidéo", () => {
    const html =
      '<div data-type="video" data-src="https://fichiers.numerique.gouv.fr/media/preview/item/abc/film.mp4"></div>';

    expect(SanitizerHTML.sanitize(html)).toContain(
      'data-src="https://fichiers.numerique.gouv.fr/media/preview/item/abc/film.mp4"',
    );
  });

  it("Doit conserver une balise video avec ses contrôles", () => {
    const html =
      '<video src="https://fichiers.numerique.gouv.fr/media/preview/item/abc/film.mp4" controls preload="metadata"></video>';

    const sanitized = SanitizerHTML.sanitize(html);

    expect(sanitized).toContain("<video");
    expect(sanitized).toContain("controls");
    expect(sanitized).toContain('preload="metadata"');
  });

  it("Doit conserver une iframe servie par fichiers.numerique.gouv.fr", () => {
    const html =
      '<iframe src="https://fichiers.numerique.gouv.fr/media/preview/item/abc/film.mp4"></iframe>';

    expect(SanitizerHTML.sanitize(html)).toContain(
      "fichiers.numerique.gouv.fr",
    );
  });

  it("Doit toujours retirer la source d'une iframe d'un hôte non autorisé", () => {
    const html = '<iframe src="https://exemple.invalide/film.mp4"></iframe>';

    expect(SanitizerHTML.sanitize(html)).not.toContain("exemple.invalide");
  });

  it("Doit toujours retirer un script", () => {
    const html = '<p>Bonjour</p><script>alert("xss")</script>';

    const sanitized = SanitizerHTML.sanitize(html);

    expect(sanitized).toContain("<p>Bonjour</p>");
    expect(sanitized).not.toContain("script");
  });
});
