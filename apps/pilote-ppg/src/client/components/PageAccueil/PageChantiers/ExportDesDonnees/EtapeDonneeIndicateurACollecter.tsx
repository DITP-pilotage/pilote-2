import { useState } from "react";
import Interrupteur from "@/components/_commons/Interrupteur/Interrupteur";
import { useExportStep } from "./useExportStep";
import { ExportOption, ExportOptionsSection } from "./ExportOptionsSection";
import { CollectStepFooter } from "./CollectStepFooter";

const OPTIONS_DEFINITION: ExportOption[] = [
  {
    value: "identifiant",
    disabled: true,
    label: (
      <>
        <span className="font-bold">identifiants</span> de l'indicateur, du
        chantier associé et du territoire
      </>
    ),
  },
  {
    value: "cadrage",
    label: (
      <>
        <span className="font-bold">cadrage</span> de l'indicateur
      </>
    ),
    detailedLabel: (
      <>
        <span className="font-bold">cadrage</span> de l'indicateur :
        description, méthode de calcul, source, périodes de mise à jour et de
        disponibilité
      </>
    ),
  },
  {
    value: "gouvernance",
    label: (
      <>
        <span className="font-bold">gouvernance</span> de l'indicateur et du
        chantier associé
      </>
    ),
    detailedLabel: <span className="font-bold">gouvernance</span>,
    details: (
      <ul className="my-0 text-sm">
        <li className="pb-0">
          de l'indicateur: typologie, objectif de baisse, restrictions
          géographiques, présence dans le Baromètre, pondérations aux
          différentes mailles
        </li>
        <li className="pb-0">
          du chantier associé: tutelle, axe et spécificités (statut,
          territorialisation, etc.)
        </li>
      </ul>
    ),
  },
];

// Comparaison, commentaires et décisions stratégiques : désactivés en attendant les nouvelles colonnes de l'export.
const OPTIONS_QUANTITATIVES: ExportOption[] = [
  {
    value: "description",
    label: (
      <>
        <span className="font-bold">données de l'indicateur</span> sur le
        territoire
      </>
    ),
    detailedLabel: (
      <>
        <span className="font-bold">données de l'indicateur</span> sur le
        territoire : valeurs initiale / avancement / cible, taux d'avancement
        (si applicable)
      </>
    ),
  },
  {
    value: "description-chantier",
    label: (
      <>
        <span className="font-bold">données du chantier</span> associé sur le
        territoire
      </>
    ),
    detailedLabel: (
      <>
        <span className="font-bold">données du chantier</span> associé : taux
        d'avancement, écart
      </>
    ),
  },
];

const OPTIONS_QUALITATIVES: ExportOption[] = [
  {
    value: "synthese",
    label: (
      <>
        <span className="font-bold">météo et synthèse des résultats</span> du
        chantier associé sur le territoire
      </>
    ),
  },
];

export const EtapeDonneeIndicateurACollecter = () => {
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

  return (
    <div>
      <p className="mt-4 mb-0">
        Sélectionnez les données que vous souhaitez collecter pour chaque
        indicateur et son chantier associé, territoire par territoire :
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
        onToggle={onChangeOptionsExport}
        options={OPTIONS_DEFINITION}
        selectedOptions={optionsSelectionnees}
        separator
        showDetails={afficherDetail}
        title="DÉFINITION"
      />
      <ExportOptionsSection
        className="pt-4"
        onToggle={onChangeOptionsExport}
        options={OPTIONS_QUANTITATIVES}
        selectedOptions={optionsSelectionnees}
        separator
        showDetails={afficherDetail}
        title="DONNÉES QUANTITATIVES"
      />
      <ExportOptionsSection
        className="pt-4"
        onToggle={onChangeOptionsExport}
        options={OPTIONS_QUALITATIVES}
        selectedOptions={optionsSelectionnees}
        showDetails={afficherDetail}
        title="DONNÉES QUALITATIVES"
      />
      <CollectStepFooter />
    </div>
  );
};
