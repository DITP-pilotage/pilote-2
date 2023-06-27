import { useCallback, useEffect, useId, useState } from 'react';
import useDropdownMenu from 'react-accessible-dropdown-menu-hook';
import rechercheUnTexteContenuDansUnContenant from '@/client/utils/rechercheUnTexteContenuDansUnContenant';
import MultiSelectProps from './MultiSelect.interface';

export default function useMultiSelect(
  optionsGroupées: MultiSelectProps['optionsGroupées'], 
  suffixeLibellé: string, 
  changementValeursSélectionnéesCallback: MultiSelectProps['changementValeursSélectionnéesCallback'], 
  valeursSélectionnéesParDéfaut?: string[],
) {
  const uniqueId = useId();
  const { buttonProps, isOpen } = useDropdownMenu(3);
  const [valeursSélectionnées, setValeursSélectionnées] = useState<Set<string>>(new Set(valeursSélectionnéesParDéfaut));
  const [optionsGroupéesFiltrées, setOptionsGroupéesFiltrées] = useState(optionsGroupées);
  const [recherche, setRecherche] = useState('');
  
  const mettreÀJourLesValeursSélectionnées = useCallback((valeur: string) => {
    let nouvellesValeursSélectionnées = new Set(valeursSélectionnées);

    if (valeursSélectionnées.has(valeur)) 
      nouvellesValeursSélectionnées.delete(valeur);
    else
      nouvellesValeursSélectionnées.add(valeur);

    setValeursSélectionnées(nouvellesValeursSélectionnées);
  }, [valeursSélectionnées]);

  const trierLesOptions = useCallback(() => {
    let optionsGroupéesTriées = structuredClone(optionsGroupées);

    optionsGroupéesTriées.forEach((groupe, index) => {
      const optionsSélectionnées = groupe.options.filter(option => valeursSélectionnées.has(option.value));
      const optionsNonSélectionnées = groupe.options.filter(option => !valeursSélectionnées.has(option.value));
      optionsGroupéesTriées[index].options = [...optionsSélectionnées, ...optionsNonSélectionnées];
    });

    setOptionsGroupéesFiltrées(optionsGroupéesTriées);
  }, [optionsGroupées, valeursSélectionnées]);

  const filtrerLesOptions = useCallback(() => {
    let optionsGroupéesQuiCorrespondentÀLaRecherche = structuredClone(optionsGroupées);

    optionsGroupéesQuiCorrespondentÀLaRecherche.forEach((groupe, index) => {
      optionsGroupéesQuiCorrespondentÀLaRecherche[index].options = groupe.options.filter(option => rechercheUnTexteContenuDansUnContenant(recherche, option.label));
    });

    setOptionsGroupéesFiltrées(optionsGroupéesQuiCorrespondentÀLaRecherche);
  }, [optionsGroupées, recherche]);

  const compterNombreDOptions = () => {
    let nombreDOptions = 0;
    optionsGroupées.forEach(groupe => nombreDOptions += groupe.options.length);
    return nombreDOptions;
  };

  const determinerLibellé = () => {
    if (valeursSélectionnées.size === 0)
      return `Aucun ${suffixeLibellé}`;
    if (valeursSélectionnées.size === compterNombreDOptions())
      return 'Tous';
    return `${valeursSélectionnées.size} ${suffixeLibellé}`;
  };

  useEffect(() => {
    setValeursSélectionnées(new Set(valeursSélectionnéesParDéfaut));
  }, [valeursSélectionnéesParDéfaut]);

  useEffect(() => {
    if (recherche !== '') {
      setRecherche('');
      trierLesOptions();
    }

    changementValeursSélectionnéesCallback([...valeursSélectionnées]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valeursSélectionnées]);

  useEffect(() => {
    if (isOpen === false) {
      trierLesOptions();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, optionsGroupées]);

  useEffect(() => {
    if (recherche !== '') {
      filtrerLesOptions();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recherche]);

  return {
    mettreÀJourLesValeursSélectionnées,
    recherche,
    setRecherche,
    optionsGroupéesFiltrées,
    estOuvert: isOpen,
    multiSelectBoutonProps: buttonProps,
    valeursSélectionnées,
    uniqueId,
    libellé: determinerLibellé(),
  };
}
