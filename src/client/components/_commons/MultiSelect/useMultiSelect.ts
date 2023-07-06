import { MutableRefObject, useCallback, useEffect, useId, useState } from 'react';
import useDropdownMenu from 'react-accessible-dropdown-menu-hook';
import rechercheUnTexteContenuDansUnContenant from '@/client/utils/rechercheUnTexteContenuDansUnContenant';
import { deuxTableauxSontIdentiques } from '@/client/utils/arrays';
import MultiSelectProps from './MultiSelect.interface';

export default function useMultiSelect(
  optionsGroupées: MultiSelectProps['optionsGroupées'], 
  suffixeLibellé: string, 
  changementValeursSélectionnéesCallback: MultiSelectProps['changementValeursSélectionnéesCallback'], 
  ref: MutableRefObject<HTMLDivElement | null>,
  valeursSélectionnéesParDéfaut?: string[],
) {
  const uniqueId = useId();
  const { buttonProps, isOpen, setIsOpen } = useDropdownMenu(3);
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

  const compterNombreDOptions = useCallback(() => {
    let nombreDOptions = 0;
    optionsGroupées.forEach(groupe => nombreDOptions += groupe.options.length);
    return nombreDOptions;
  }, [optionsGroupées]);

  const determinerLibellé =  useCallback(() => {
    let nombreÉlémentSélectionnés = 0;
    
    optionsGroupées.forEach(groupe => {
      groupe.options.forEach(option => {
        if (valeursSélectionnées.has(option.value)) 
          nombreÉlémentSélectionnés++;
      });
    });

    if (nombreÉlémentSélectionnés === 0)
      return `Aucun ${suffixeLibellé}`;
    if (nombreÉlémentSélectionnés === compterNombreDOptions())
      return 'Tous';
    
    return `${nombreÉlémentSélectionnés} ${suffixeLibellé}`;
  }, [compterNombreDOptions, optionsGroupées, suffixeLibellé, valeursSélectionnées]);

  const fermerLeMenu = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape')
      setIsOpen(false);
  }, [setIsOpen]);

  useEffect(() => {
    if (!valeursSélectionnéesParDéfaut || !deuxTableauxSontIdentiques([...valeursSélectionnées], valeursSélectionnéesParDéfaut)) 
      setValeursSélectionnées(new Set(valeursSélectionnéesParDéfaut));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valeursSélectionnéesParDéfaut]);

  useEffect(() => {
    changementValeursSélectionnéesCallback([...valeursSélectionnées]);

    if (isOpen === false) {
      trierLesOptions();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valeursSélectionnées]);

  useEffect(() => {
    if (isOpen === false) {
      trierLesOptions();
    }
    if (ref.current) {
      ref.current.scrollTop = 0;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, optionsGroupées]);

  useEffect(() => {
    if (recherche !== '') 
      filtrerLesOptions();
    else 
      trierLesOptions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recherche]);

  useEffect(() => {
    window.addEventListener('keydown', fermerLeMenu);
    return () => window.removeEventListener('keydown', fermerLeMenu);
  }, [fermerLeMenu]);

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
