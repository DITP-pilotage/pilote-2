import {
  MutableRefObject,
  useCallback,
  useEffect,
  useId,
  useState,
} from "react";
import useDropdownMenu from "react-accessible-dropdown-menu-hook";
import rechercheUnTexteContenuDansUnContenant from "@/client/utils/rechercheUnTexteContenuDansUnContenant";
import InputGroupeProps from "./InputGroupe.interface";

export default function useInputGroupe({
  optionsGroupées,
  ref,
  valeurSelectionneeParDefaut,
}: {
  optionsGroupées: InputGroupeProps["optionsGroupées"];
  ref: MutableRefObject<HTMLDivElement | null>;
  valeurSelectionneeParDefaut: string;
}) {
  const uniqueId = useId();
  const { buttonProps, isOpen, setIsOpen } = useDropdownMenu(3);
  const [optionsGroupéesFiltrées, setOptionsGroupéesFiltrées] =
    useState(optionsGroupées);
  const [recherche, setRecherche] = useState("");

  const trierLesOptions = useCallback(() => {
    let optionsGroupéesTriées = JSON.parse(
      JSON.stringify(optionsGroupées),
    ) as InputGroupeProps["optionsGroupées"];

    optionsGroupéesTriées.forEach((groupe, index) => {
      const optionsSélectionnées = groupe.options.filter(
        (option) => valeurSelectionneeParDefaut === option.value,
      );
      const optionsNonSélectionnées = groupe.options.filter(
        (option) => !(valeurSelectionneeParDefaut === option.value),
      );
      optionsGroupéesTriées[index].options = [
        ...optionsSélectionnées,
        ...optionsNonSélectionnées,
      ];
    });

    setOptionsGroupéesFiltrées(optionsGroupéesTriées);
  }, [optionsGroupées, valeurSelectionneeParDefaut]);

  const filtrerLesOptions = useCallback(() => {
    let optionsGroupéesQuiCorrespondentÀLaRecherche = JSON.parse(
      JSON.stringify(optionsGroupées),
    ) as InputGroupeProps["optionsGroupées"];

    optionsGroupéesQuiCorrespondentÀLaRecherche.forEach((groupe, index) => {
      optionsGroupéesQuiCorrespondentÀLaRecherche[index].options =
        groupe.options.filter((option) =>
          rechercheUnTexteContenuDansUnContenant(recherche, option.label),
        );
    });

    setOptionsGroupéesFiltrées(optionsGroupéesQuiCorrespondentÀLaRecherche);
  }, [optionsGroupées, recherche]);

  const fermerLeMenu = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    },
    [setIsOpen],
  );

  useEffect(() => {
    if (!isOpen) {
      trierLesOptions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, optionsGroupées]);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (recherche !== "") filtrerLesOptions();
    else trierLesOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recherche]);

  useEffect(() => {
    window.addEventListener("keydown", fermerLeMenu);
    return () => window.removeEventListener("keydown", fermerLeMenu);
  }, [fermerLeMenu]);

  return {
    recherche,
    setRecherche,
    optionsGroupéesFiltrées,
    estOuvert: isOpen,
    multiSelectBoutonProps: buttonProps,
    valeurSelectionneeParDefaut,
    uniqueId,
  };
}
