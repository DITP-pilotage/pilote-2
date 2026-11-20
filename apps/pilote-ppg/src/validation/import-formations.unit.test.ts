import { importFormationsSchema } from "@/validation/import-formations";
// En production, la route charge la carte d'erreurs globale des formulaires : on la
// charge aussi, pour vérifier que les messages de l'envoi l'emportent sur elle.
import "@/validation/utilisateur";

const MOTIF = { id: 2101, nom: "CAMPUS PILOTE : Introduction à l'outil" };

const SEANCE = {
  id: 884512,
  motif_id: 2101,
  date_debut: "2026-12-03T09:30:00+01:00",
  duree_minutes: 90,
  animateurs: ["Camille Martin", "Alex Durand"],
  cancelled_at: null,
  nombre_places_max: 20,
  nombre_inscrits: 12,
  url_inscription:
    "https://rdv.anct.gouv.fr/users/rdv_wizard_step/new?rdv_collectif_id=884512",
};

const ENVOI = { motifs: [MOTIF], seances: [SEANCE] };

const erreursDe = (envoi: unknown) => {
  const resultat = importFormationsSchema.safeParse(envoi);
  return resultat.success
    ? []
    : resultat.error.issues.map((issue) => ({
        chemin: issue.path.join("."),
        message: issue.message,
      }));
};

describe("importFormationsSchema", () => {
  it("accepte un envoi complet et ignore les champs inconnus", () => {
    // Given
    const envoi = {
      ...ENVOI,
      seances: [{ ...SEANCE, visio_url: "https://webconf.example/abc" }],
    };

    // When
    const resultat = importFormationsSchema.safeParse(envoi);

    // Then
    expect(resultat).toEqual({ success: true, data: ENVOI });
  });

  it("accepte une liste d'animateurs absente ou des noms absents, tels quels", () => {
    // Given
    const envoi = {
      motifs: [MOTIF],
      seances: [
        { ...SEANCE, animateurs: null },
        { ...SEANCE, id: 884513, animateurs: [null, " ", "Camille Martin"] },
      ],
    };

    // When
    const resultat = importFormationsSchema.safeParse(envoi);

    // Then
    expect(resultat).toEqual({ success: true, data: envoi });
  });

  it("refuse un corps qui n'est pas un objet", () => {
    // When
    const erreurs = erreursDe(undefined);

    // Then
    expect(erreurs).toEqual([
      {
        chemin: "",
        message: "Un objet JSON { motifs, seances } est attendu.",
      },
    ]);
  });

  it("refuse une date au format brut de RDV-SP", () => {
    // When
    const erreurs = erreursDe({
      motifs: [MOTIF],
      seances: [{ ...SEANCE, date_debut: "2026-12-03 09:30:00 +0100" }],
    });

    // Then
    expect(erreurs).toEqual([
      {
        chemin: "seances.0.date_debut",
        message:
          "Date ISO 8601 avec fuseau attendue, par exemple 2026-12-03T09:30:00+01:00.",
      },
    ]);
  });

  it("refuse un identifiant envoyé en texte", () => {
    // When
    const erreurs = erreursDe({
      motifs: [{ ...MOTIF, id: "2101" }],
      seances: [],
    });

    // Then
    expect(erreurs).toEqual([
      {
        chemin: "motifs.0.id",
        message: "Un identifiant RDV-SP entier est attendu.",
      },
    ]);
  });

  it("refuse une durée nulle avec un message qui le dit", () => {
    // When
    const erreurs = erreursDe({
      motifs: [MOTIF],
      seances: [{ ...SEANCE, duree_minutes: 0 }],
    });

    // Then
    expect(erreurs).toEqual([
      {
        chemin: "seances.0.duree_minutes",
        message: "La durée doit être strictement positive.",
      },
    ]);
  });

  it("refuse un lien d'inscription qui n'est pas en https", () => {
    // When
    const erreurs = erreursDe({
      motifs: [MOTIF],
      seances: [{ ...SEANCE, url_inscription: "http://rdv.anct.gouv.fr/x" }],
    });

    // Then
    expect(erreurs).toEqual([
      {
        chemin: "seances.0.url_inscription",
        message: "Un lien d'inscription en https est attendu.",
      },
    ]);
  });

  it("laisse aux règles de l'envoi les listes vides et les doublons", () => {
    // When
    const erreurs = erreursDe({ motifs: [], seances: [SEANCE, SEANCE] });

    // Then
    expect(erreurs).toEqual([]);
  });
});
