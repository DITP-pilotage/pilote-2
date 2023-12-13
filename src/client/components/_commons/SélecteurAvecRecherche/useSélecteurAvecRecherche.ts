import { useCallback, useEffect, useState } from 'react';
import useDropdownMenu from 'react-accessible-dropdown-menu-hook';
import rechercheUnTexteContenuDansUnContenant from '@/client/utils/rechercheUnTexteContenuDansUnContenant';
import SélecteurAvecRechercheProps, { SélecteurAvecRechercheOption } from './SélecteurAvecRecherche.interface';

export default function useSélecteurAvecRecherche<T extends string>(
  options: SélecteurAvecRechercheProps<T>['options'],
  valeurSélectionnée: SélecteurAvecRechercheProps<T>['valeurSélectionnée'],
) {

  const { buttonProps, isOpen, setIsOpen } = useDropdownMenu(3);
  const [optionsFiltrées, setOptionsFiltrées] = useState<SélecteurAvecRechercheOption<T>[]>();
  const [recherche, setRecherche] = useState('');

  const determinerLibellé =  useCallback(() => {
    return options.find(option => option.valeur === valeurSélectionnée)?.libellé;
  }, [options, valeurSélectionnée]);

  const filtrerLesOptions = useCallback(() => {
    const optionsQuiCorrespondentÀLaRecherche = options.filter(option => rechercheUnTexteContenuDansUnContenant(recherche, option.libellé));
    setOptionsFiltrées(optionsQuiCorrespondentÀLaRecherche);
  }, [options, recherche]);

  useEffect(() => {
    if (recherche !== '') 
      filtrerLesOptions();
    else
      setOptionsFiltrées(options);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recherche, options]);

  useEffect(() => {
    setIsOpen(false);
  }, [valeurSélectionnée, setIsOpen]);

  return {
    estOuvert: isOpen,
    SélecteurBoutonProps: buttonProps,
    libelléValeurSélectionnée: determinerLibellé(),
    optionsFiltrées,
    setRecherche,
    recherche,
  };
}
