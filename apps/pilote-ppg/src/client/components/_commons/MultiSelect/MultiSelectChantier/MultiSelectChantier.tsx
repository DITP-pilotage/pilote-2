import { FunctionComponent } from "react";
import MultiSelect from "@/client/components/_commons/MultiSelect/MultiSelect";
import { MultiSelectOptionsGroupées } from "@/client/components/_commons/MultiSelect/MultiSelect.interface";
import { trierParOrdreAlphabétique } from "@/client/utils/arrays";
import { ChantierSynthétisé } from "@/server/domain/chantier/Chantier.interface";

interface MultiSelectChantierProps {
  changementValeursSélectionnéesCallback: (
    chantiersIdsSélectionnés: string[],
  ) => void;
  chantiers: ChantierSynthétisé[];
  chantiersIdsSélectionnésParDéfaut?: string[];
  valeursDésactivées?: string[];
  afficherBoutonsSélection?: boolean;
  desactive?: boolean;
}

const MultiSelectChantier: FunctionComponent<MultiSelectChantierProps> = ({
  chantiersIdsSélectionnésParDéfaut,
  changementValeursSélectionnéesCallback,
  valeursDésactivées,
  chantiers,
  afficherBoutonsSélection,
  desactive,
}) => {
  const chantiersArchives = chantiers.filter(
    (chantier) => chantier.statut === "ARCHIVE",
  );
  const chantiersNonArchives = chantiers.filter(
    (chantier) => chantier.statut !== "ARCHIVE",
  );

  const optionsGroupées: MultiSelectOptionsGroupées = [
    {
      label: "Chantiers",
      options: trierParOrdreAlphabétique(
        chantiersNonArchives.map((chantier) => ({
          label: `${chantier.id} - ${chantier.nom}`,
          value: chantier.id,
          disabled: valeursDésactivées?.includes(chantier.id),
        })),
        "label",
      ),
    },
    {
      label: "Chantiers archivés",
      options: trierParOrdreAlphabétique(
        chantiersArchives.map((chantier) => ({
          label: `${chantier.id} - ${chantier.nom} (archivés)`,
          value: chantier.id,
          disabled: valeursDésactivées?.includes(chantier.id),
          classesSupplementaires: "italic !text-dsfr-mention-grey",
        })),
        "label",
      ),
    },
  ];

  return (
    <MultiSelect
      afficherBoutonsSélection={afficherBoutonsSélection}
      changementValeursSélectionnéesCallback={
        changementValeursSélectionnéesCallback
      }
      desactive={desactive}
      label="Chantier(s)"
      optionsGroupées={optionsGroupées}
      suffixeLibellé="chantier(s) sélectionné(s)"
      valeursSélectionnéesParDéfaut={chantiersIdsSélectionnésParDéfaut}
    />
  );
};

export default MultiSelectChantier;
