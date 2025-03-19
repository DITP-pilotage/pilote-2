import { FunctionComponent } from 'react';
import MultiSelect from '@/client/components/_commons/MultiSelectNew/MultiSelect';
import {
  MultiSelectOption,
  MultiSelectOptionGroupée,
  MultiSelectOptions,
  MultiSelectOptionsGroupées,
} from '@/client/components/_commons/MultiSelectNew/MultiSelect.interface';
import { trierParOrdreAlphabétique } from '@/client/utils/arrays';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';
import { TerritoireAvecNombreUtilisateurs } from '@/server/gestion-utilisateur/domain/Territoire';

interface MultiSelectTerritoireProps {
  changementValeursSélectionnéesCallback: (territoiresCodesSélectionnés: string[]) => void
  territoiresCodesSélectionnésParDéfaut?: string[]
  groupesÀAfficher: {
    nationale: boolean
    regionale: boolean
    departementale: boolean
  },
  afficherBoutonsSélection?: boolean,
  activerLaRestrictionDesTerritoires?: boolean
  listeTerritoiresSelectionnable: TerritoireAvecNombreUtilisateurs[]
}

export const MAXIMUM_COMPTES_AUTORISE_PAR_REGION = 200;
export const MAXIMUM_COMPTES_AUTORISE_PAR_DEPARTEMENT = 150;
const MAXIMUM_COMPTES_AUTORISE_PAR_TERRITOIRE: Record<MailleInterne, number> = {
  departementale: MAXIMUM_COMPTES_AUTORISE_PAR_DEPARTEMENT,
  regionale: MAXIMUM_COMPTES_AUTORISE_PAR_REGION,
};

const générerLesOptions = (nom: string, code: string, maille: MailleInterne, nombreUtilisateur: number, activerLaRestrictionDesTerritoires: boolean | undefined): MultiSelectOption => ({
  label: nom,
  value: code,
  disabled: activerLaRestrictionDesTerritoires ? nombreUtilisateur > MAXIMUM_COMPTES_AUTORISE_PAR_TERRITOIRE[maille] : false,
  afficherIcone: activerLaRestrictionDesTerritoires ? nombreUtilisateur > MAXIMUM_COMPTES_AUTORISE_PAR_TERRITOIRE[maille] : false,
});

export const MultiSelectTerritoire: FunctionComponent<MultiSelectTerritoireProps> = ({
  territoiresCodesSélectionnésParDéfaut,
  changementValeursSélectionnéesCallback,
  groupesÀAfficher,
  afficherBoutonsSélection,
  activerLaRestrictionDesTerritoires,
  listeTerritoiresSelectionnable,
}) => {

  const départements = listeTerritoiresSelectionnable.filter(territoire => territoire.maille === 'departementale') ?? [];
  const régions = listeTerritoiresSelectionnable.filter(territoire => territoire.maille === 'regionale') ?? [];

  const optionFR = {
    label: 'National',
    options: [{
      label: 'France',
      value: 'NAT-FR',
    }],
  };

  const optionsRégions = {
    label: 'Régions',
    options: trierParOrdreAlphabétique<MultiSelectOptions>(régions.map(d => générerLesOptions(d.nomAffiché, d.code, 'regionale', d.nombreUtilisateur, activerLaRestrictionDesTerritoires)), 'label'),
  };

  const optionsDépartements = {
    label: 'Départements',
    options: trierParOrdreAlphabétique<MultiSelectOptions>(départements.map(d => générerLesOptions(d.nomAffiché, d.code, 'departementale', d.nombreUtilisateur, activerLaRestrictionDesTerritoires)), 'label'),
  };

  const options: MultiSelectOptionsGroupées = [
    groupesÀAfficher.nationale ? optionFR : null,
    groupesÀAfficher.regionale ? optionsRégions : null,
    groupesÀAfficher.departementale ? optionsDépartements : null,
  ].filter((option): option is MultiSelectOptionGroupée => option !== null);

  return (
    <MultiSelect
      afficherBoutonsSélection={afficherBoutonsSélection}
      changementValeursSélectionnéesCallback={(valeursSélectionnées: string[]) => changementValeursSélectionnéesCallback(valeursSélectionnées)}
      label='Territoire(s)'
      optionsGroupées={options}
      suffixeLibellé='territoire(s) sélectionné(s)'
      valeursSélectionnéesParDéfaut={territoiresCodesSélectionnésParDéfaut}
    />
  );
};
