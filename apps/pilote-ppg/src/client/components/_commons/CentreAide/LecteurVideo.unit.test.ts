import {
  estFichierVideoDirect,
  estUrlHttpSure,
  sansAutoplay,
} from "@/client/components/_commons/CentreAide/LecteurVideo";

describe("estUrlHttpSure", () => {
  it("Doit accepter une URL https", () => {
    expect(estUrlHttpSure("https://video.finances.gouv.fr/x")).toBe(true);
  });

  it("Doit refuser un schéma javascript", () => {
    expect(estUrlHttpSure("javascript:alert(1)")).toBe(false);
  });

  it("Doit refuser une chaîne qui n'est pas une URL", () => {
    expect(estUrlHttpSure("pas une url")).toBe(false);
  });
});

describe("sansAutoplay", () => {
  it("Doit retirer les paramètres d'autoplay", () => {
    expect(
      sansAutoplay("https://video.finances.gouv.fr/x?autoplay=1&start=3"),
    ).toBe("https://video.finances.gouv.fr/x?start=3");
  });

  it("Doit laisser intacte une URL sans autoplay", () => {
    expect(sansAutoplay("https://video.finances.gouv.fr/x")).toBe(
      "https://video.finances.gouv.fr/x",
    );
  });
});

describe("estFichierVideoDirect", () => {
  it("Doit reconnaître un média servi par fichiers.numerique.gouv.fr", () => {
    expect(
      estFichierVideoDirect(
        "https://fichiers.numerique.gouv.fr/media/preview/item/77d479ac-5d13-4f1f-a44c-856e45e16cec/ma_video.mp4",
      ),
    ).toBe(true);
  });

  it("Doit refuser un hôte d'intégration classique", () => {
    expect(estFichierVideoDirect("https://video.finances.gouv.fr/x")).toBe(
      false,
    );
  });
});
