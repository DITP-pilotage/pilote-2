import { render, screen } from "@testing-library/react";
import { DetailValidationFichierContrat } from "@/server/app/contrats/DetailValidationFichierContrat.interface";
import ResultatValidationFichier from "@/components/PageImportIndicateur/ResultatValidationFichier/ResultatValidationFichier";

describe("ResultatValidationFichier", () => {
  it("quand le fichier est valide ne doit rien afficher", () => {
    // Given
    const rapport: DetailValidationFichierContrat = {
      id: "0df7df91-7c63-4e45-ba85-6553bf873705",
      estValide: true,
      listeErreursValidation: [],
    };

    // When
    render(<ResultatValidationFichier rapport={rapport} />);

    // Then
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("quand le fichier contient des erreurs, doit afficher que le tableau d'erreur", () => {
    // Given
    const rapport: DetailValidationFichierContrat = {
      id: "9e058686-eecb-4079-a192-29547a3ee842",
      estValide: false,
      listeErreursValidation: [
        {
          cellule: "cellule 1",
          nom: "nom 1",
          message: "Message erreur 1",
          numeroDeLigne: 1,
          positionDeLigne: 1,
          nomDuChamp: "Nom du champ 1",
          positionDuChamp: 1,
        },
        {
          cellule: "cellule 2",
          nom: "nom 2",
          message: "Message erreur 2",
          numeroDeLigne: 2,
          positionDeLigne: 2,
          nomDuChamp: "Nom du champ 2",
          positionDuChamp: 2,
        },
      ],
    };

    // When
    render(<ResultatValidationFichier rapport={rapport} />);

    // Then
    expect(screen.getByText("Message erreur 1")).toBeInTheDocument();
    expect(screen.getByText("cellule 1")).toBeInTheDocument();
    expect(screen.getByText("Nom du champ 1")).toBeInTheDocument();

    expect(screen.getByText("Message erreur 2")).toBeInTheDocument();
    expect(screen.getByText("cellule 2")).toBeInTheDocument();
    expect(screen.getByText("Nom du champ 2")).toBeInTheDocument();
  });
});
