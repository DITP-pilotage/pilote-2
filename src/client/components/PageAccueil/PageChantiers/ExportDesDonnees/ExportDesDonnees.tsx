import "@gouvfr/dsfr/dist/component/radio/radio.min.css";
import { FunctionComponent } from "react";
import { parseAsInteger, parseAsStringLiteral, useQueryState } from "nuqs";
import Modale__legacy from "@/components/_commons/Modale/Modale__legacy";
import IndicateurDEtapes from "@/components/_commons/IndicateurDEtapes/IndicateurDEtapes";
import { EtapeContenuAExporter } from "@/components/PageAccueil/PageChantiers/ExportDesDonnees/EtapeContenuAExporter";
import { EtapeDonneeChantierACollecter } from "@/components/PageAccueil/PageChantiers/ExportDesDonnees/EtapeDonneeChantierACollecter";
import { EtapePerimetreExport } from "@/components/PageAccueil/PageChantiers/ExportDesDonnees/EtapePerimetreExport";
import { EtapeRecapitulatif } from "@/components/PageAccueil/PageChantiers/ExportDesDonnees/EtapeRecapitulatif";
import { EtapeDonneeIndicateurACollecter } from "@/components/PageAccueil/PageChantiers/ExportDesDonnees/EtapeDonneeIndicateurACollecter";
import { EtapeDonneeHistoriqueIndicateurACollecter } from "@/components/PageAccueil/PageChantiers/ExportDesDonnees/EtapeDonneeHistoriqueIndicateurACollecter";
import { EtapeDonneeEnCoursDeTelechargement } from "./EtapeDonneeEnCoursDeTelechargement";

const Stepper = {
  ETAPE_ELEMENTS_A_EXPORTER: {
    numeroEtape: 1,
    titreEtape: "Éléments à exporter",
  },
  ETAPE_PERIMETRE_EXPORT: {
    numeroEtape: 2,
    titreEtape: "Périmètre de l'export",
  },
  ETAPE_DONNEE_A_COLLECTER: {
    numeroEtape: 3,
    titreEtape: "Données à collecter",
  },
  ETAPE_RECAPITULATIF: {
    numeroEtape: 4,
    titreEtape: "Récapitulatif et validation",
  },
  ETAPE_DONNEE_EN_COURS_DE_TELECHARGEMENT: {
    numeroEtape: 5,
    titreEtape: "Données en cours de téléchargement",
  },
};

export const ExportDesDonnees: FunctionComponent<{
  fermetureCallback: () => void;
  territoireCodeSelectionne: string;
  idHtmlModale: string;
}> = ({ fermetureCallback, territoireCodeSelectionne, idHtmlModale }) => {
  const étapes = [
    Stepper.ETAPE_ELEMENTS_A_EXPORTER.titreEtape,
    Stepper.ETAPE_PERIMETRE_EXPORT.titreEtape,
    Stepper.ETAPE_DONNEE_A_COLLECTER.titreEtape,
    Stepper.ETAPE_RECAPITULATIF.titreEtape,
    Stepper.ETAPE_DONNEE_EN_COURS_DE_TELECHARGEMENT.titreEtape,
  ];

  const [etapeCourante] = useQueryState(
    "etapeCourante",
    parseAsInteger
      .withDefault(Stepper.ETAPE_ELEMENTS_A_EXPORTER.numeroEtape)
      .withOptions({
        shallow: false,
        history: "push",
      }),
  );

  const [typeExport] = useQueryState(
    "typeExport",
    parseAsStringLiteral([
      "chantiers",
      "indicateurs",
      "historique-indicateurs",
    ]).withDefault("chantiers"),
  );

  return (
    <Modale__legacy
      fermetureCallback={fermetureCallback}
      idHtml={idHtmlModale}
      tailleModale="lg"
    >
      <IndicateurDEtapes
        sousTitreEtape="Exporter les données"
        étapeCourante={etapeCourante}
        étapes={étapes}
      />
      {etapeCourante === Stepper.ETAPE_ELEMENTS_A_EXPORTER.numeroEtape ? (
        <EtapeContenuAExporter />
      ) : etapeCourante === Stepper.ETAPE_PERIMETRE_EXPORT.numeroEtape ? (
        <EtapePerimetreExport />
      ) : etapeCourante === Stepper.ETAPE_DONNEE_A_COLLECTER.numeroEtape ? (
        typeExport === "chantiers" ? (
          <EtapeDonneeChantierACollecter />
        ) : typeExport === "indicateurs" ? (
          <EtapeDonneeIndicateurACollecter />
        ) : (
          <EtapeDonneeHistoriqueIndicateurACollecter />
        )
      ) : etapeCourante === Stepper.ETAPE_RECAPITULATIF.numeroEtape ? (
        <EtapeRecapitulatif
          territoireCodeSelectionne={territoireCodeSelectionne}
        />
      ) : etapeCourante ===
        Stepper.ETAPE_DONNEE_EN_COURS_DE_TELECHARGEMENT.numeroEtape ? (
        <EtapeDonneeEnCoursDeTelechargement />
      ) : null}
    </Modale__legacy>
  );
};
