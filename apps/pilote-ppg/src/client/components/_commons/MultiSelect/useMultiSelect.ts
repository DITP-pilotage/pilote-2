import { useCallback, useEffect, useId, useState } from "react";
import rechercheUnTexteContenuDansUnContenant from "@/client/utils/rechercheUnTexteContenuDansUnContenant";
import { deuxTableauxSontIdentiques } from "@/client/utils/arrays";
import { MultiSelectProps } from "./MultiSelect.interface";

export function useMultiSelect(
  optionsGroupées: MultiSelectProps["optionsGroupées"],
  suffixeLibellé: string,
  changementValeursSélectionnéesCallback: MultiSelectProps["changementValeursSélectionnéesCallback"],
  isOpen: boolean,
  valeursSélectionnéesParDéfaut?: string[],
) {
  const uniqueId = useId();
  const [valeursSélectionnées, setValeursSélectionnées] = useState<Set<string>>(
    new Set(valeursSélectionnéesParDéfaut),
  );
  const [optionsGroupéesFiltrées, setOptionsGroupéesFiltrées] =
    useState(optionsGroupées);
  const [recherche, setRecherche] = useState("");

  const mettreÀJourLesValeursSélectionnées = useCallback(
    (valeur: string) => {
      let nouvellesValeursSélectionnées = new Set(valeursSélectionnées);

      if (valeursSélectionnées.has(valeur)) {
        nouvellesValeursSélectionnées.delete(valeur);
      } else {
        nouvellesValeursSélectionnées.add(valeur);
      }

      setValeursSélectionnées(nouvellesValeursSélectionnées);
    },
    [valeursSélectionnées],
  );

  const trierLesOptions = useCallback(() => {
    let optionsGroupéesTriées = JSON.parse(
      JSON.stringify(optionsGroupées),
    ) as MultiSelectProps["optionsGroupées"];

    optionsGroupéesTriées.forEach((groupe, index) => {
      const optionsSélectionnées = groupe.options.filter((option) =>
        valeursSélectionnées.has(option.value),
      );
      const optionsNonSélectionnées = groupe.options.filter(
        (option) => !valeursSélectionnées.has(option.value),
      );
      optionsGroupéesTriées[index].options = [
        ...optionsSélectionnées,
        ...optionsNonSélectionnées,
      ];
    });

    setOptionsGroupéesFiltrées(optionsGroupéesTriées);
  }, [optionsGroupées, valeursSélectionnées]);

  const filtrerLesOptions = useCallback(() => {
    let optionsGroupéesQuiCorrespondentÀLaRecherche = JSON.parse(
      JSON.stringify(optionsGroupées),
    ) as MultiSelectProps["optionsGroupées"];

    optionsGroupéesQuiCorrespondentÀLaRecherche.forEach((groupe, index) => {
      optionsGroupéesQuiCorrespondentÀLaRecherche[index].options =
        groupe.options.filter((option) =>
          rechercheUnTexteContenuDansUnContenant(recherche, option.label),
        );
    });

    setOptionsGroupéesFiltrées(optionsGroupéesQuiCorrespondentÀLaRecherche);
  }, [optionsGroupées, recherche]);

  const compterNombreDOptions = useCallback(() => {
    let nombreDOptions = 0;
    optionsGroupées.forEach(
      (groupe) => (nombreDOptions += groupe.options.length),
    );
    return nombreDOptions;
  }, [optionsGroupées]);

  const determinerLibellé = useCallback(() => {
    let nombreÉlémentSélectionnés = 0;

    optionsGroupées.forEach((groupe) => {
      groupe.options.forEach((option) => {
        if (valeursSélectionnées.has(option.value)) nombreÉlémentSélectionnés++;
      });
    });

    if (nombreÉlémentSélectionnés === 0) return `Aucun ${suffixeLibellé}`;
    if (nombreÉlémentSélectionnés === compterNombreDOptions()) return "Tous";

    return `${nombreÉlémentSélectionnés} ${suffixeLibellé}`;
  }, [
    compterNombreDOptions,
    optionsGroupées,
    suffixeLibellé,
    valeursSélectionnées,
  ]);

  useEffect(() => {
    if (
      !valeursSélectionnéesParDéfaut ||
      !deuxTableauxSontIdentiques(
        [...valeursSélectionnées],
        valeursSélectionnéesParDéfaut,
      )
    ) {
      setValeursSélectionnées(new Set(valeursSélectionnéesParDéfaut));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valeursSélectionnéesParDéfaut]);

  useEffect(() => {
    changementValeursSélectionnéesCallback([...valeursSélectionnées]);

    if (!isOpen) {
      trierLesOptions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valeursSélectionnées]);

  useEffect(() => {
    if (!isOpen) {
      trierLesOptions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, optionsGroupées]);

  useEffect(() => {
    if (recherche !== "") {
      filtrerLesOptions();
    } else {
      trierLesOptions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recherche]);

  return {
    mettreÀJourLesValeursSélectionnées,
    recherche,
    setRecherche,
    optionsGroupéesFiltrées,
    valeursSélectionnées,
    uniqueId,
    libellé: determinerLibellé(),
  };
}
