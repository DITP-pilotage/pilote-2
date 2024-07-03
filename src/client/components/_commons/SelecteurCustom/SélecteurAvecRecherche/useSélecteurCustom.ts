import { useCallback, useEffect } from 'react';
import useDropdownMenu from 'react-accessible-dropdown-menu-hook';
import SélecteurCustomProps from './SélecteurCustom.interface';

export default function useSélecteurCustom<T extends string>(
  options: SélecteurCustomProps<T>['options'],
  valeurSélectionnée: SélecteurCustomProps<T>['valeurSélectionnée'],
) {

  const { buttonProps, isOpen, setIsOpen } = useDropdownMenu(3);

  const determinerLibellé =  useCallback(() => {
    return options.find(option => option.valeur === valeurSélectionnée)?.libellé;
  }, [options, valeurSélectionnée]);


  useEffect(() => {
    setIsOpen(false);
  }, [valeurSélectionnée, setIsOpen]);

  return {
    estOuvert: isOpen,
    setEstOuvert: setIsOpen,
    SélecteurBoutonProps: buttonProps,
    libelléValeurSélectionnée: determinerLibellé(),
  };
}
