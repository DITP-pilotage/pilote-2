import { useState } from "react";
import { useSession } from "next-auth/react";
import Interrupteur from "@/components/_commons/Interrupteur/Interrupteur";
import { profilsTerritoriaux } from "@/shared/utilisateur/Utilisateur.interface";
import { useExportStep } from "./useExportStep";
import { ExportOption, ExportOptionsSection } from "./ExportOptionsSection";
import { CollectStepFooter } from "./CollectStepFooter";

const OPTIONS_DEFINITION: ExportOption[] = [
  {
    value: "identifiant",
    disabled: true,
    label: (
      <>
        <span className="font-bold">identifiants</span> du chantier et du
        territoire
      </>
    ),
  },
  {
    value: "gouvernance",
    label: (
      <>
        <span className="font-bold">gouvernance</span> du chantier
      </>
    ),
    detailedLabel: (
      <>
        <span className="font-bold">gouvernance</span> du chantier : tutelle,
        axe, spécificités (statut, présence dans le Baromètre,
        territorialisation, restrictions géographiques)
      </>
    ),
  },
  {
    value: "responsabilite",
    label: (
      <>
        <span className="font-bold">responsabilité</span> du chantier
      </>
    ),
    detailedLabel: (
      <>
        <span className="font-bold">responsabilité</span> du chantier :
        directeurs, responsables et coordinateurs
      </>
    ),
  },
  {
    value: "objectif",
    label: (
      <>
        <span className="font-bold">objectifs</span> du chantier
      </>
    ),
    detailedLabel: (
      <>
        <span className="font-bold">objectifs</span> du chantier: notre
        ambition, ce qui a déjà été fait, ce qui reste à faire
      </>
    ),
  },
];

const OPTIONS_QUANTITATIVES: ExportOption[] = [
  {
    value: "description",
    label: (
      <>
        <span className="font-bold">données descriptives</span> du chantier sur
        le territoire
      </>
    ),
    detailedLabel: (
      <>
        <span className="font-bold">données descriptives</span> du chantier sur
        le territoire : taux d'avancement, écart
      </>
    ),
  },
  {
    value: "comparaison",
    label: (
      <>
        <span className="font-bold">données de comparaison</span> du chantier
      </>
    ),
    detailedLabel: (
      <>
        <span className="font-bold">données de comparaison</span> du chantier
        aux mailles inférieures et supérieures (si applicable) : taux
        d'avancement, écart
      </>
    ),
  },
  {
    value: "valeurs-reference",
    label: <span className="font-bold">valeurs de référence</span>,
    detailedLabel: (
      <>
        <span className="font-bold">valeurs de référence</span> : Minimum,
        médiane et maximum des taux d'avancement observés pour chaque chantier à
        la maille régionale et départementale.
      </>
    ),
  },
];

const OPTION_SYNTHESE: ExportOption = {
  value: "synthese",
  label: (
    <>
      <span className="font-bold">météo et synthèse des résultats</span> du
      chantier sur le territoire
    </>
  ),
};

const OPTION_COMMENTAIRE: ExportOption = {
  value: "commentaire",
  label: (
    <>
      <span className="font-bold">commentaires</span> du chantier
    </>
  ),
  details: (
    <ul className="my-0 text-sm">
      <li className="pb-0">
        sur les territoires départementaux et régionaux : commentaires sur les
        données, autres résultats obtenus
      </li>
      <li className="pb-0">
        sur le territoire national : autres résultats obtenus, risques et freins
        à lever, solutions et actions à venir, exemples concrets de réussite
      </li>
    </ul>
  ),
};

const OPTION_DECISION: ExportOption = {
  value: "decision",
  label: (
    <>
      suivi des <span className="font-bold">décisions stratégiques</span> du
      chantier
    </>
  ),
};

export const EtapeDonneeChantierACollecter = () => {
  const { data: session } = useSession();

  const {
    exportState: { optionsExport },
    updateExport,
  } = useExportStep();

  const [afficherDetail, setAfficherDetail] = useState<boolean>(false);

  const optionsSelectionnees = optionsExport.split(",");

  const onChangeOptionsExport = (optionExport: string) => {
    const arrOptionsExport = optionsExport.split(",");
    if (arrOptionsExport.includes(optionExport)) {
      arrOptionsExport.splice(arrOptionsExport.indexOf(optionExport), 1);
    } else {
      arrOptionsExport.push(optionExport);
    }

    updateExport({ optionsExport: arrOptionsExport.join(",") });
  };

  const estAutoriseASelectionnerLesDecisionsStrategiques =
    !profilsTerritoriaux.includes(session!.profil);

  const optionsQualitatives = estAutoriseASelectionnerLesDecisionsStrategiques
    ? [OPTION_SYNTHESE, OPTION_COMMENTAIRE, OPTION_DECISION]
    : [OPTION_SYNTHESE, OPTION_COMMENTAIRE];

  return (
    <div>
      <p className="mt-4 mb-0">
        Sélectionnez les données que vous souhaitez collecter pour chaque
        chantier, territoire par territoire :
      </p>
      <div className="flex justify-end">
        <Interrupteur
          checked={afficherDetail}
          className="pb-0"
          direction="inverse"
          libellé="afficher le détail"
          onChange={setAfficherDetail}
        />
      </div>
      <ExportOptionsSection
        labelClassName="text-sm"
        onToggle={onChangeOptionsExport}
        options={OPTIONS_DEFINITION}
        selectedOptions={optionsSelectionnees}
        separator
        showDetails={afficherDetail}
        title="DÉFINITION"
      />
      <ExportOptionsSection
        className="pt-4"
        labelClassName="text-sm"
        onToggle={onChangeOptionsExport}
        options={OPTIONS_QUANTITATIVES}
        selectedOptions={optionsSelectionnees}
        separator
        showDetails={afficherDetail}
        title="DONNÉES QUANTITATIVES"
      />
      <ExportOptionsSection
        className="pt-4"
        labelClassName="text-sm"
        onToggle={onChangeOptionsExport}
        options={optionsQualitatives}
        selectedOptions={optionsSelectionnees}
        showDetails={afficherDetail}
        title="DONNÉES QUALITATIVES"
      />
      <CollectStepFooter />
    </div>
  );
};
