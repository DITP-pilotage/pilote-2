import "@testing-library/jest-dom";
import {
  getAllByRole,
  queryByText,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import MinistèreBuilder from "@/server/domain/ministère/Ministère.builder";
import Ministère from "@/server/domain/ministère/Ministère.interface";
import TableauChantiers from "./TableauChantiers";
import { DonnéesTableauChantiers } from "./TableauChantiers.interface";

jest.mock("next/router", () => require("next-router-mock"));

class TableauChantiersTest {
  private ministèresDisponibles: Ministère[] = [
    new MinistèreBuilder().avecNom("Ministère 1").build(),
  ];

  private données: DonnéesTableauChantiers[] = [
    {
      porteur: this.ministèresDisponibles[0],
      nom: "Déployer le programme FR",
      id: "1",
      avancement: 97,
      météo: "COUVERT" as const,
      typologie: {
        estBaromètre: false,
        estTerritorialisé: true,
        estBrouillon: false,
      },
      dateDeMàjDonnéesQuantitatives: new Date().toISOString(),
      dateDeMàjDonnéesQualitatives: new Date().toISOString(),
      écart: 0,
      tendance: "STAGNATION",
      maillesApplicables: ["nationale", "regionale", "departementale"],
    },
    {
      porteur: this.ministèresDisponibles[0],
      nom: "Lutter contre la fraude fiscale",
      id: "2",
      avancement: 98,
      météo: "COUVERT" as const,
      typologie: {
        estBaromètre: true,
        estTerritorialisé: true,
        estBrouillon: true,
      },
      dateDeMàjDonnéesQuantitatives: new Date().toISOString(),
      dateDeMàjDonnéesQualitatives: new Date().toISOString(),
      écart: 0,
      tendance: "STAGNATION",
      maillesApplicables: ["nationale", "regionale", "departementale"],
    },
    {
      porteur: this.ministèresDisponibles[0],
      nom: "Elections du maire",
      id: "3",
      avancement: 99,
      météo: "SOLEIL" as const,
      typologie: {
        estBaromètre: false,
        estTerritorialisé: false,
        estBrouillon: false,
      },
      dateDeMàjDonnéesQuantitatives: new Date().toISOString(),
      dateDeMàjDonnéesQualitatives: new Date().toISOString(),
      écart: 0,
      tendance: "STAGNATION",
      maillesApplicables: ["nationale", "regionale", "departementale"],
    },
  ];

  private territoireCode = "DEPT-87";

  nombreDeDonnées() {
    return this.données.length;
  }

  filtrerParContenuTextuel(texte: string) {
    return waitFor(() => userEvent.type(screen.getByRole("searchbox"), texte));
  }

  récupérerLesLignesDuTableau() {
    const conteneur = document.querySelector("tbody");
    return getAllByRole(conteneur!, "row");
  }

  récupérerLeNombreDeLignesDuTableau() {
    return this.récupérerLesLignesDuTableau().length;
  }

  récupérerUneLigneDuTableau(numéroDeLigne: number) {
    return this.récupérerLesLignesDuTableau()[numéroDeLigne - 1];
  }

  récupérerUneLigneParLeNomDuChantier(nom: DonnéesTableauChantiers["nom"]) {
    return screen.getByRole("row", { name: new RegExp(".*" + nom + ".*") });
  }

  trierSurLaColonne(labelDuBoutonDeTri: string) {
    return waitFor(() =>
      userEvent.click(screen.getByLabelText(labelDuBoutonDeTri)),
    );
  }

  render() {
    return waitFor(() =>
      render(
        <TableauChantiers
          chantiersSontArchives={false}
          données={this.données}
          // TODO: modifier ?
          jalon={2024}
          ministèresDisponibles={this.ministèresDisponibles}
          nombreTotalChantiersAvecAlertes={120}
          territoireCode={this.territoireCode}
        />,
      ),
    );
  }
}

let tableau: TableauChantiersTest;

beforeEach(async () => {
  // Given
  tableau = new TableauChantiersTest();

  // When
  await tableau.render();
});
// eslint-disable-next-line jest/no-disabled-tests
describe.skip("TableauChantiers", () => {
  test("le tableau comporte le nombre de lignes adéquat", () => {
    // Then
    expect(tableau.récupérerLeNombreDeLignesDuTableau()).toBe(
      tableau.nombreDeDonnées(),
    );
  });

  test("le tableau comporte les données d'entrée", () => {
    // Then
    expect(screen.getByText("Déployer le programme FR")).toBeInTheDocument();
    expect(
      screen.getByText("Lutter contre la fraude fiscale"),
    ).toBeInTheDocument();
    expect(screen.getByText("Elections du maire")).toBeInTheDocument();
  });

  describe("quand l'utilisateur clique sur le bouton de tri croissant d'une colonne", () => {
    test("les éléments du tableau sont triés par ordre croissant", async () => {
      // When
      await tableau.trierSurLaColonne(
        'trier la colonne "avancement" par ordre croissant',
      );

      // Then
      expect(tableau.récupérerUneLigneDuTableau(1)).toHaveTextContent("97");
      expect(tableau.récupérerUneLigneDuTableau(2)).toHaveTextContent("98");
      expect(tableau.récupérerUneLigneDuTableau(3)).toHaveTextContent("99");
    });
  });

  test("la recherche applique un filtre sur les lignes", async () => {
    // When
    await tableau.filtrerParContenuTextuel("fr");

    // Then
    expect(tableau.récupérerLeNombreDeLignesDuTableau()).toBe(2);
    tableau.récupérerLesLignesDuTableau().forEach((ligne) => {
      expect(ligne).toHaveTextContent(/.*fr.*/i);
    });
  });

  describe("Les bons pictogrammes de typologie apparaissent dans la colonnes typologie", () => {
    test("Quand le chantier est territorialisé et du baromètre", () => {
      // Given
      const ligneDUnChantierTerritorialisé =
        tableau.récupérerUneLigneParLeNomDuChantier(
          "Lutter contre la fraude fiscale",
        );
      const pictoTerritorialisé = queryByText(
        ligneDUnChantierTerritorialisé,
        "chantier territorialisé",
      );
      const pictoBaromère = queryByText(
        ligneDUnChantierTerritorialisé,
        "élément du baromètre",
      );
      const pictoBrouillon = queryByText(
        ligneDUnChantierTerritorialisé,
        "chantier brouillon",
      );

      // Then
      expect(pictoTerritorialisé).toBeInTheDocument();
      expect(pictoBaromère).toBeInTheDocument();
      expect(pictoBrouillon).toBeInTheDocument();
    });

    test("Quand le chantier est territorialisé et n'est pas du baromètre ni un chantier brouillon", () => {
      // Given
      const ligneDUnChantierTerritorialisé =
        tableau.récupérerUneLigneParLeNomDuChantier("Déployer le programme FR");
      const pictoTerritorialisé = queryByText(
        ligneDUnChantierTerritorialisé,
        "chantier territorialisé",
      );
      const pictoBaromère = queryByText(
        ligneDUnChantierTerritorialisé,
        "élément du baromètre",
      );
      const pictoBrouillon = queryByText(
        ligneDUnChantierTerritorialisé,
        "chantier brouillon",
      );

      // Then
      expect(pictoTerritorialisé).toBeInTheDocument();
      expect(pictoBaromère).not.toBeInTheDocument();
      expect(pictoBrouillon).not.toBeInTheDocument();
    });

    test("Quand le chantier n'est ni territorialisé, ni du baromètre, ni un chantier brouillon", () => {
      // Given
      const ligneDUnChantierTerritorialisé =
        tableau.récupérerUneLigneParLeNomDuChantier("Elections du maire");
      const pictoTerritorialisé = queryByText(
        ligneDUnChantierTerritorialisé,
        "chantier territorialisé",
      );
      const pictoBaromère = queryByText(
        ligneDUnChantierTerritorialisé,
        "élément du baromètre",
      );
      const pictoBrouillon = queryByText(
        ligneDUnChantierTerritorialisé,
        "chantier brouillon",
      );

      // Then
      expect(pictoTerritorialisé).not.toBeInTheDocument();
      expect(pictoBaromère).not.toBeInTheDocument();
      expect(pictoBrouillon).not.toBeInTheDocument();
    });
  });
});
