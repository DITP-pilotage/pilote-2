import { fireEvent, screen } from "@testing-library/react";
import { render } from "@/components/shared/DataTable/testUtils";
import "@testing-library/jest-dom";
import { TableauIndicateursACompleter } from "@/components/_commons/ChatUI/TableauIndicateursACompleter";
import type { DetailIndicateursACompleter } from "@/server/albert/tools/sortieIndicateursACompleter";
import type { LigneACompleter } from "@/server/albert/tools/indicateursACompleter";

const NOMS_CHANTIERS: Record<string, string> = {
  "CH-018": "Accès aux soins",
  "CH-022": "Rénovation énergétique",
};

const ligne = (
  ligneACompleter: Pick<
    LigneACompleter,
    "chantier_id" | "indicateur_id" | "territoire_code" | "territoire_nom"
  >,
): LigneACompleter => ({
  ...ligneACompleter,
  chantier_nom: NOMS_CHANTIERS[ligneACompleter.chantier_id],
  territoire_nom_affiche: `${ligneACompleter.territoire_code.slice(5)} - ${ligneACompleter.territoire_nom}`,
  indicateur_nom: `Nom ${ligneACompleter.indicateur_id}`,
  maille: "DEPT",
  motifs: ["VA non à jour"],
  date_derniere_valeur: null,
  mise_a_jour_attendue_depuis: null,
});

const detailDe = (lignes: LigneACompleter[]): DetailIndicateursACompleter => ({
  motifs: ["va"],
  perimetre: "Bretagne et ses départements",
  lignes,
});

const lignesDeuxChantiers = [
  ligne({
    chantier_id: "CH-018",
    indicateur_id: "IND-1",
    territoire_code: "DEPT-29",
    territoire_nom: "Finistère",
  }),
  ligne({
    chantier_id: "CH-018",
    indicateur_id: "IND-2",
    territoire_code: "DEPT-29",
    territoire_nom: "Finistère",
  }),
  ligne({
    chantier_id: "CH-022",
    indicateur_id: "IND-3",
    territoire_code: "DEPT-01",
    territoire_nom: "Ain",
  }),
];

const afficherDetail = (detail: DetailIndicateursACompleter) => {
  render(<TableauIndicateursACompleter detail={detail} />);
  fireEvent.click(screen.getByText("Afficher le détail"));
};

describe("TableauIndicateursACompleter", () => {
  test("regroupe par territoire, avec ses indicateurs et ses chantiers comptés", () => {
    // Given
    const detail = detailDe(lignesDeuxChantiers);
    afficherDetail(detail);

    // When
    fireEvent.change(screen.getByLabelText("Regrouper par"), {
      target: { value: "territoire" },
    });

    // Then
    expect(
      screen.getByRole("button", {
        name: "29 - Finistère · 2 indicateurs · 1 chantier",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "01 - Ain · 1 indicateur · 1 chantier",
      }),
    ).toBeInTheDocument();
  });

  test("titre le détail avec le périmètre, les motifs, le jalon et les effectifs", () => {
    // Given
    const detail: DetailIndicateursACompleter = {
      motifs: ["va", "vc"],
      jalon: 2026,
      perimetre: "Bretagne et ses départements",
      lignes: lignesDeuxChantiers.slice(0, 2),
    };

    // When
    afficherDetail(detail);

    // Then
    expect(
      screen.getByText(
        "Détail par territoire · Bretagne et ses départements · VA non à jour, VC manquante (jalon 2026) · 2 lignes · 1 chantier",
      ),
    ).toBeInTheDocument();
  });
});
