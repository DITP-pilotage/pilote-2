/* eslint-disable unicorn/no-useless-undefined */
import { useCallback, useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { UtilisateurFormInputs, UtilisateurFormulaireProps } from '@/client/components/PageUtilisateurFormulaire/UtilisateurFormulaire/UtilisateurFormulaire.interface';
import { Profil } from '@/server/domain/profil/Profil.interface';
import { auMoinsUneValeurDuTableauEstContenueDansLAutreTableau } from '@/client/utils/arrays';
import { ChantierSynthétisé } from '@/server/domain/chantier/Chantier.interface';

export default function useSaisieDesInformationsUtilisateurSaisieIndicateurs(
  profilSélectionné: Profil | undefined,
  chantiersSélectionnables: ChantierSynthétisé[],
  utilisateur?: UtilisateurFormulaireProps['utilisateur'],
) {
  const { watch, setValue, getValues, resetField, unregister } = useFormContext<UtilisateurFormInputs>();

  const profilCodeSélectionné = watch('profil');
  const chantiersSaisieIndicateursSélectionnés = watch('habilitations.saisie.indicateur.chantiers');
  const périmètresMinistérielsSaisieIndicateursSélectionnés = watch('habilitations.saisie.indicateur.périmètres');

  const [ancienProfilCodeSélectionné, setAncienProfilCodeSélectionné] = useState<string>(getValues('profil'));
  const [chantiersIdsAppartenantsAuPérimètresMinistérielsSélectionnésSaisieIndicateurs, setChantiersIdsAppartenantsAuPérimètresMinistérielsSélectionnésSaisieIndicateurs] = useState<string[]>([]);

  const [afficherChampSaisieIndicateursChantiers, setAfficherChampSaisieIndicateursChantiers] = useState(false);
  const [afficherChampSaisieIndicateursPérimètres, setAfficherChampSaisieIndicateursPérimètres] = useState(false);

  // GESTION CHANGEMENT DE PROFIL
  useEffect(() => {
    setAfficherChampSaisieIndicateursChantiers(!!profilSélectionné && !profilSélectionné.chantiers.lecture.tous && profilSélectionné.chantiers.saisieIndicateur.tousTerritoires && profilSélectionné.code !== 'DROM');
    setAfficherChampSaisieIndicateursPérimètres(!!profilSélectionné && !profilSélectionné.chantiers.lecture.tous && profilSélectionné.chantiers.saisieIndicateur.tousTerritoires && profilSélectionné.code !== 'DROM');
  }, [profilSélectionné]);


  useEffect(() => {
    if (ancienProfilCodeSélectionné !== profilCodeSélectionné) {
      resetField('habilitations.saisie.indicateur.chantiers', { defaultValue: [] });
      resetField('habilitations.saisie.indicateur.périmètres', { defaultValue: [] });

      if (ancienProfilCodeSélectionné === undefined) {
        if (utilisateur?.habilitations?.['saisie.indicateur'].chantiers) 
          setValue('habilitations.saisie.indicateur.chantiers', utilisateur?.habilitations?.['saisie.indicateur'].chantiers);
      
        if (utilisateur?.habilitations?.['saisie.indicateur'].périmètres) 
          setValue('habilitations.lecture.périmètres', utilisateur?.habilitations?.['saisie.indicateur'].périmètres);
      }

      setAncienProfilCodeSélectionné(profilCodeSélectionné);
    }
  }, [ancienProfilCodeSélectionné, profilCodeSélectionné, resetField, setValue, unregister, utilisateur]);


  // GESTION CHANTIERS ET PERIMETRES MINISTERIELS 
  const déterminerChantiersSélectionnésÀPartirDesPérimètresMinistériels = useCallback((périmètresMinistérielsIdsSélectionnés: string[]) => {
    const chantiersAppartenantsAuPérimètresMinistérielsSélectionnés = chantiersSélectionnables.filter(chantier => auMoinsUneValeurDuTableauEstContenueDansLAutreTableau(chantier.périmètreIds, périmètresMinistérielsIdsSélectionnés));
  
    return chantiersAppartenantsAuPérimètresMinistérielsSélectionnés.map(c => c.id);
  }, [chantiersSélectionnables]);

  const handleChangementValeursSélectionnéesChantiersSaisieIndicateurs = useCallback((valeursSélectionnées: string[]) => {    
    setValue('habilitations.saisie.indicateur.chantiers', valeursSélectionnées);
  }, [setValue]);

  useEffect(() => {
    if (chantiersSélectionnables) {
      handleChangementValeursSélectionnéesChantiersSaisieIndicateurs(chantiersSélectionnables.map(c => c.id));
    }
  }, [chantiersSélectionnables, handleChangementValeursSélectionnéesChantiersSaisieIndicateurs]);


  const handleChangementValeursSélectionnéesPérimètresMinistérielsSaisieIndicateurs = useCallback((valeursSélectionnées: string[]) => {  
    const périmètresIdsActuellementsSélectionnés = getValues('habilitations.saisie.indicateur.périmètres') ?? [];
    const périmètresIdsDécochés = périmètresIdsActuellementsSélectionnés.filter(périmètreId => !valeursSélectionnées.includes(périmètreId));
    const chantiersIdsDesPérimètresDécochés = déterminerChantiersSélectionnésÀPartirDesPérimètresMinistériels(périmètresIdsDécochés);
    const chantiersIdsActuellementSélectionnés = getValues('habilitations.saisie.indicateur.chantiers') ?? [];
    const nouveauChantiersIds = chantiersIdsActuellementSélectionnés.filter(chantierId => !chantiersIdsDesPérimètresDécochés.includes(chantierId));
    setValue('habilitations.saisie.indicateur.chantiers', nouveauChantiersIds);
    setValue('habilitations.saisie.indicateur.périmètres', valeursSélectionnées);
    setChantiersIdsAppartenantsAuPérimètresMinistérielsSélectionnésSaisieIndicateurs(déterminerChantiersSélectionnésÀPartirDesPérimètresMinistériels(valeursSélectionnées));
  }, [déterminerChantiersSélectionnésÀPartirDesPérimètresMinistériels, getValues, setValue]);

  useEffect(() => {
    handleChangementValeursSélectionnéesChantiersSaisieIndicateurs([...getValues('habilitations.saisie.indicateur.chantiers') ?? [], ...chantiersIdsAppartenantsAuPérimètresMinistérielsSélectionnésSaisieIndicateurs]);
  }, [chantiersIdsAppartenantsAuPérimètresMinistérielsSélectionnésSaisieIndicateurs, getValues, handleChangementValeursSélectionnéesChantiersSaisieIndicateurs]);


  useEffect(() => {
    handleChangementValeursSélectionnéesPérimètresMinistérielsSaisieIndicateurs(getValues('habilitations.saisie.indicateur.périmètres'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chantiersSélectionnables]);

  return {
    handleChangementValeursSélectionnéesChantiersSaisieIndicateurs,
    handleChangementValeursSélectionnéesPérimètresMinistérielsSaisieIndicateurs,
    chantiersIdsAppartenantsAuPérimètresMinistérielsSélectionnésSaisieIndicateurs,
    afficherChampSaisieIndicateursChantiers,
    afficherChampSaisieIndicateursPérimètres,
    chantiersSaisieIndicateursSélectionnés,
    périmètresMinistérielsSaisieIndicateursSélectionnés,
  };
}
