import { FunctionComponent, useEffect, useState } from "react";
import MultiSelect from "@/client/components/_commons/MultiSelectNew/MultiSelect";
import { MultiSelectOptionsGroupées } from "@/client/components/_commons/MultiSelectNew/MultiSelect.interface";
import { trierParOrdreAlphabétique } from "@/client/utils/arrays";
import { PerimetreMinisteriel } from "@/server/gestion-utilisateur/domain/PerimetreMinisteriel";

interface MultiSelectPérimètreMinistérielProps {
  changementValeursSélectionnéesCallback: (
    périmètresMinistérielsIdsSélectionnés: string[],
  ) => void;
  périmètresMinistérielsIdsSélectionnésParDéfaut?: string[];
  listePerimetresMinisteriel: PerimetreMinisteriel[];
  afficherBoutonsSélection?: boolean;
}

export const MultiSelectPérimètreMinistériel: FunctionComponent<
  MultiSelectPérimètreMinistérielProps
> = ({
  périmètresMinistérielsIdsSélectionnésParDéfaut,
  changementValeursSélectionnéesCallback,
  afficherBoutonsSélection,
  listePerimetresMinisteriel,
}) => {
  const [optionsGroupées, setOptionsGroupées] =
    useState<MultiSelectOptionsGroupées>([]);

  useEffect(() => {
    setOptionsGroupées([
      {
        label: "Périmètres Ministériels",
        options: trierParOrdreAlphabétique(
          listePerimetresMinisteriel.map((périmètreMinistériel) => ({
            label: périmètreMinistériel.nom,
            value: périmètreMinistériel.id,
          })),
          "label",
        ),
      },
    ]);
  }, [listePerimetresMinisteriel]);

  return (
    <MultiSelect
      afficherBoutonsSélection={afficherBoutonsSélection}
      changementValeursSélectionnéesCallback={(
        valeursSélectionnées: string[],
      ) => changementValeursSélectionnéesCallback(valeursSélectionnées)}
      label="Périmètre(s) ministériel(s)"
      optionsGroupées={optionsGroupées}
      suffixeLibellé="périmètre(s) ministériel(s) sélectionné(s)"
      valeursSélectionnéesParDéfaut={
        périmètresMinistérielsIdsSélectionnésParDéfaut
      }
    />
  );
};
