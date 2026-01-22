import { render, screen, within } from "@testing-library/react";
import PageImportIndicateur from "@/components/PageImportIndicateur/PageImportIndicateur";
import { ChantierInformations } from "@/components/PageImportIndicateur/ChantierInformation.interface";
import Indicateur from "@/server/domain/indicateur/Indicateur.interface";
import IndicateurBuilder from "@/server/domain/indicateur/Indicateur.builder";

const CHANTIER_NOM =
  "Offrir à chaque enfant une éducation culturelle et artistique";

jest.mock(
  "@/components/_commons/Cartographie/Cartographie.tsx",
  () =>
    function Cartographie() {
      return <span>Carto</span>;
    },
);
jest.mock(
  "@/components/_commons/IndicateursChantier/Bloc/Détails/Évolution/IndicateurEvolution.tsx",
  () =>
    // eslint-disable-next-line react/no-multi-comp
    function IndicateurChart() {
      return <span>Indicateur Chart</span>;
    },
);

jest.mock("next/router", () => require("next-router-mock"));

describe("PageImportIndicateur", () => {
  describe("En tête", () => {
    it("doit afficher un titre indiquant que l'on est sur la page indicateur", () => {
      // Given
      const chantierInformations: ChantierInformations = {
        id: "chantierId",
        nom: CHANTIER_NOM,
      };

      // When
      render(
        <PageImportIndicateur
          chantierInformations={chantierInformations}
          hrefBoutonRetour="unlien"
          indicateurs={[]}
          informationsIndicateur={[]}
          rapport={null}
        />,
      );

      // Then
      const titre = screen.getByRole("heading", { level: 1 });

      expect(titre).toBeInTheDocument();
      expect(titre).toHaveTextContent(CHANTIER_NOM);
    });

    it("doit afficher un fil d'Ariane indiquant l'indicateur, le chantier et le retour à l'accueil", () => {
      // Given
      const chantierInformation: ChantierInformations = {
        id: "chantierId",
        nom: CHANTIER_NOM,
      };

      // When
      render(
        <PageImportIndicateur
          chantierInformations={chantierInformation}
          hrefBoutonRetour="/chantier/chantierId/NAT-FR"
          indicateurs={[]}
          informationsIndicateur={[]}
          rapport={null}
        />,
      );

      // Then
      const fileDAriane = screen.getByRole("navigation");
      const elementAccueilFileDAriane = within(fileDAriane).getByRole("link", {
        name: "Accueil",
      });
      const elementChantierFileDAriane = within(fileDAriane).getByRole("link", {
        name: "Chantier",
      });

      expect(fileDAriane).toBeInTheDocument();
      expect(elementAccueilFileDAriane).toHaveAttribute("href", "/");
      expect(elementChantierFileDAriane).toHaveAttribute(
        "href",
        "/chantier/chantierId/NAT-FR",
      );
      expect(fileDAriane).toHaveTextContent("Indicateurs");
    });
  });

  describe("Section import fichier indicateur pour un chantier", () => {
    it("doit afficher le titre de la section", () => {
      // Given
      const chantierInformation: ChantierInformations = {
        id: "chantierId",
        nom: CHANTIER_NOM,
      };

      // When
      render(
        <PageImportIndicateur
          chantierInformations={chantierInformation}
          hrefBoutonRetour="unlien"
          indicateurs={[]}
          informationsIndicateur={[]}
          rapport={null}
        />,
      );

      // Then
      const titreDeLaSection = screen.getByRole("heading", {
        level: 2,
        name: "Importez vos données",
      });

      expect(titreDeLaSection).toBeInTheDocument();
    });

    it("doit afficher la liste des titres des indicateurs", async () => {
      // Given
      const indicateurs: Indicateur[] = [
        new IndicateurBuilder()
          .avecType("IMPACT")
          .avecId("IND-156798")
          .avecNom("IND-156798-CH-123 nom indicateur")
          .build(),
        new IndicateurBuilder()
          .avecType("CONTEXTE")
          .avecId("IND-156799")
          .avecNom("IND-156799-CH-124 nom indicateur 2")
          .build(),
      ];

      const chantierInformation: ChantierInformations = {
        id: "chantierId",
        nom: CHANTIER_NOM,
      };

      // When
      render(
        <PageImportIndicateur
          chantierInformations={chantierInformation}
          hrefBoutonRetour="unlien"
          indicateurs={indicateurs}
          informationsIndicateur={[]}
          rapport={null}
        />,
      );

      // Then
      const titreCatégorieIndicateur1 = screen.getByText(
        "IND-156798 : IND-156798-CH-123 nom indicateur",
      );
      const titreCatégorieIndicateur2 = screen.getByText(
        "IND-156799 : IND-156799-CH-124 nom indicateur 2",
      );

      expect(titreCatégorieIndicateur1).toBeInTheDocument();
      expect(titreCatégorieIndicateur2).toBeInTheDocument();
    });
  });
});
