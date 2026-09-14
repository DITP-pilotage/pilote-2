import { libelleEvenementIndicateurTerritoireValeur } from "@/server/indicateur-territoire-valeur-evenement/domain/libelleEvenementIndicateurTerritoireValeur";

describe("libelleEvenementIndicateurTerritoireValeur", () => {
  it("VALEUR_CREEE : pas de description, résultat avec la valeur", () => {
    expect(libelleEvenementIndicateurTerritoireValeur("VALEUR_CREEE", 42)).toEqual({
      description: null,
      resultat: "nouvelle valeur affichée dans PILOTE : 42",
    });
  });

  it("VALEUR_MODIFIEE avec valeur : description et résultat avec la valeur", () => {
    expect(
      libelleEvenementIndicateurTerritoireValeur("VALEUR_MODIFIEE", 42),
    ).toEqual({
      description: "import de données par la direction de projet",
      resultat: "nouvelle valeur affichée dans PILOTE : 42",
    });
  });

  it("VALEUR_MODIFIEE sans valeur : résultat de suppression", () => {
    expect(
      libelleEvenementIndicateurTerritoireValeur("VALEUR_MODIFIEE", null),
    ).toEqual({
      description: "import de données par la direction de projet",
      resultat: "la valeur a été supprimée de PILOTE",
    });
  });

  it("VALEUR_HISTORISEE : description seule", () => {
    expect(
      libelleEvenementIndicateurTerritoireValeur("VALEUR_HISTORISEE", null),
    ).toEqual({
      description:
        "import d'une valeur d'avancement plus récente par la direction de projet",
      resultat: null,
    });
  });

  it("PROPOSITION_VALEUR_CREEE avec valeur nulle : N/A dans la description", () => {
    expect(
      libelleEvenementIndicateurTerritoireValeur(
        "PROPOSITION_VALEUR_CREEE",
        null,
      ),
    ).toEqual({
      description: "nouvelle proposition du territoire : N/A",
      resultat: null,
    });
  });

  it("PROPOSITION_VALEUR_MODIFIEE : description seule", () => {
    expect(
      libelleEvenementIndicateurTerritoireValeur(
        "PROPOSITION_VALEUR_MODIFIEE",
        15,
      ),
    ).toEqual({
      description: "modification de la proposition du territoire : 15",
      resultat: null,
    });
  });

  it("PROPOSITION_VALEUR_SUPPRIMEE : description seule", () => {
    expect(
      libelleEvenementIndicateurTerritoireValeur(
        "PROPOSITION_VALEUR_SUPPRIMEE",
        null,
      ),
    ).toEqual({
      description: "suppression de la proposition par le territoire",
      resultat: null,
    });
  });

  it("PROPOSITION_VALEUR_ACCUSEE_RECEPTION : description seule", () => {
    expect(
      libelleEvenementIndicateurTerritoireValeur(
        "PROPOSITION_VALEUR_ACCUSEE_RECEPTION",
        null,
      ),
    ).toEqual({
      description:
        "accusé de réception de la proposition par la direction de projet",
      resultat: null,
    });
  });

  it("PROPOSITION_VALEUR_REFUSEE : description seule", () => {
    expect(
      libelleEvenementIndicateurTerritoireValeur(
        "PROPOSITION_VALEUR_REFUSEE",
        null,
      ),
    ).toEqual({
      description: "proposition refusée par la direction de projet",
      resultat: null,
    });
  });

  it("PROPOSITION_VALEUR_ACCEPTEE : description et résultat", () => {
    expect(
      libelleEvenementIndicateurTerritoireValeur(
        "PROPOSITION_VALEUR_ACCEPTEE",
        30,
      ),
    ).toEqual({
      description: "proposition acceptée par la direction de projet",
      resultat: "nouvelle valeur affichée dans PILOTE : 30",
    });
  });

  it("PROPOSITION_VALEUR_ACCEPTEE_AVEC_MODIFICATION : description et résultat", () => {
    expect(
      libelleEvenementIndicateurTerritoireValeur(
        "PROPOSITION_VALEUR_ACCEPTEE_AVEC_MODIFICATION",
        35,
      ),
    ).toEqual({
      description:
        "proposition acceptée avec modification par la direction de projet",
      resultat: "nouvelle valeur affichée dans PILOTE : 35",
    });
  });

  it("PROPOSITION_VALEUR_IGNOREE_VALEUR_MODIFIEE avec valeur : description et résultat", () => {
    expect(
      libelleEvenementIndicateurTerritoireValeur(
        "PROPOSITION_VALEUR_IGNOREE_VALEUR_MODIFIEE",
        12,
      ),
    ).toEqual({
      description:
        "import de données par la direction de projet (la proposition en cours a été ignorée)",
      resultat: "nouvelle valeur affichée dans PILOTE : 12",
    });
  });

  it("PROPOSITION_VALEUR_IGNOREE_VALEUR_MODIFIEE sans valeur : résultat de suppression", () => {
    expect(
      libelleEvenementIndicateurTerritoireValeur(
        "PROPOSITION_VALEUR_IGNOREE_VALEUR_MODIFIEE",
        null,
      ),
    ).toEqual({
      description:
        "import de données par la direction de projet (la proposition en cours a été ignorée)",
      resultat: "la valeur a été supprimée de PILOTE",
    });
  });

  it("PROPOSITION_VALEUR_IGNOREE_VALEUR_HISTORISEE : description seule", () => {
    expect(
      libelleEvenementIndicateurTerritoireValeur(
        "PROPOSITION_VALEUR_IGNOREE_VALEUR_HISTORISEE",
        null,
      ),
    ).toEqual({
      description:
        "import d'une valeur d'avancement plus récente par la direction de projet (la proposition en cours a été ignorée)",
      resultat: null,
    });
  });
});
