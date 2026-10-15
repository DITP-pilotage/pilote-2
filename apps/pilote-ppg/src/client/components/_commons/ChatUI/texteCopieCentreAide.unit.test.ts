import { texteCopieCentreAide } from "@/components/_commons/ChatUI/texteCopieCentreAide";

describe("texteCopieCentreAide", () => {
  test("liste les pages du centre d'aide avec leur adresse complète", () => {
    // Given
    const output = {
      trouve: true,
      reponse: "TA = (VA − VI) / (VC − VI)",
      sources: [
        {
          id: "taux",
          titre: "Le taux d'avancement",
          chemin: ["Introduction et notions clés"],
          url: "/centre-aide-pilote?article=taux",
        },
      ],
      _output_instructions: "",
    };

    // When
    const texte = texteCopieCentreAide({
      output,
      origine: "https://pilote.gouv.fr",
    });

    // Then
    expect(texte).toBe(
      "Pour plus d'informations :\n- Le taux d'avancement : https://pilote.gouv.fr/centre-aide-pilote?article=taux",
    );
  });

  test("donne le contact de l'équipe PILOTE quand le centre d'aide ne répond pas", () => {
    // Given
    const output = {
      trouve: false,
      reponse: "",
      sources: [],
      _output_instructions: "",
    };

    // When
    const texte = texteCopieCentreAide({
      output,
      origine: "https://pilote.gouv.fr",
    });

    // Then
    expect(texte).toBe(
      "Contacter l'équipe PILOTE : pilote.ditp@modernisation.gouv.fr",
    );
  });
});
