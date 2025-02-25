import { FunctionComponent, useEffect, useState } from 'react';
import MultiSelect from '@/client/components/_commons/MultiSelectNew/MultiSelect';
import {
  MultiSelectOptions,
  MultiSelectOptionsGroupées,
} from '@/client/components/_commons/MultiSelectNew/MultiSelect.interface';
import { deuxTableauxSontIdentiques, trierParOrdreAlphabétique } from '@/client/utils/arrays';
import { Profil } from '@/server/gestion-utilisateur/domain/Profil';

interface MultiSelectProfilsProps {
  changementValeursSélectionnéesCallback: (profilsIdsSélectionnés: string[]) => void
  profils: Profil[]
  profilsIdsSélectionnésParDéfaut?: string[]
  valeursDésactivées?: string[]
  afficherBoutonsSélection?: boolean
}

export const MultiSelectProfil: FunctionComponent<MultiSelectProfilsProps> = ({
  profilsIdsSélectionnésParDéfaut,
  changementValeursSélectionnéesCallback,
  valeursDésactivées,
  profils,
  afficherBoutonsSélection,
}) => {
  const [valeursSélectionnéesParDéfaut, setValeursSélectionnéesParDéfaut] = useState(profilsIdsSélectionnésParDéfaut);
  const [optionsGroupées, setOptionsGroupées] = useState<MultiSelectOptionsGroupées>([]);

  useEffect(() => {
    if (profils) {
      setOptionsGroupées([{
        label: 'Profils',
        options: trierParOrdreAlphabétique<MultiSelectOptions>(profils.map(profil => ({
          label: profil.nom,
          value: profil.code,
          disabled: valeursDésactivées?.includes(profil.code),
        })), 'label'),
      }]);
    }
  }, [profils, valeursDésactivées]);

  useEffect(() => {
    if (!deuxTableauxSontIdentiques(profilsIdsSélectionnésParDéfaut ?? [], valeursSélectionnéesParDéfaut ?? [])) {
      setValeursSélectionnéesParDéfaut(profilsIdsSélectionnésParDéfaut);
    }
  }, [profilsIdsSélectionnésParDéfaut, valeursSélectionnéesParDéfaut, setValeursSélectionnéesParDéfaut]);

  return (
    <MultiSelect
      afficherBoutonsSélection={afficherBoutonsSélection}
      changementValeursSélectionnéesCallback={(valeursSélectionnées: string[]) => changementValeursSélectionnéesCallback(valeursSélectionnées)}
      label='Profil(s)'
      optionsGroupées={optionsGroupées}
      suffixeLibellé='profils(s) sélectionné(s)'
      valeursSélectionnéesParDéfaut={valeursSélectionnéesParDéfaut}
    />
  );
};
