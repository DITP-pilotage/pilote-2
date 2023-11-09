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
  const chantiersSaisieIndicateursSélectionnés = watch('habilitations.saisieIndicateur.chantiers');
  const périmètresMinistérielsSaisieIndicateursSélectionnés = watch('habilitations.saisieIndicateur.périmètres');

  const [ancienProfilCodeSélectionné, setAncienProfilCodeSélectionné] = useState<string>(getValues('profil'));
  const [chantiersIdsAppartenantsAuPérimètresMinistérielsSélectionnésSaisieIndicateurs, setChantiersIdsAppartenantsAuPérimètresMinistérielsSélectionnésSaisieIndicateurs] = useState<string[]>([]);

  const [afficherChampSaisieIndicateursChantiers, setAfficherChampSaisieIndicateursChantiers] = useState(false);
  const [afficherChampSaisieIndicateursPérimètres, setAfficherChampSaisieIndicateursPérimètres] = useState(false);

  // GESTION CHANGEMENT DE PROFIL
  useEffect(() => {
    setAfficherChampSaisieIndicateursChantiers(!!profilSélectionné && !profilSélectionné.chantiers.lecture.tous && profilSélectionné.chantiers.saisieIndicateur.tousTerritoires);
    setAfficherChampSaisieIndicateursPérimètres(!!profilSélectionné && !profilSélectionné.chantiers.lecture.tous && profilSélectionné.chantiers.saisieIndicateur.tousTerritoires);
  }, [profilSélectionné]);


  useEffect(() => {
    if (ancienProfilCodeSélectionné !== profilCodeSélectionné) {
      resetField('habilitations.saisieIndicateur.chantiers', { defaultValue: [] });
      resetField('habilitations.saisieIndicateur.périmètres', { defaultValue: [] });

      if (ancienProfilCodeSélectionné === undefined) {
        if (utilisateur?.habilitations?.['saisieIndicateur'].chantiers) 
          setValue('habilitations.saisieIndicateur.chantiers', utilisateur?.habilitations?.['saisieIndicateur'].chantiers);
      
        if (utilisateur?.habilitations?.['saisieIndicateur'].périmètres) 
          setValue('habilitations.lecture.périmètres', utilisateur?.habilitations?.['saisieIndicateur'].périmètres);
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
    setValue('habilitations.saisieIndicateur.chantiers', valeursSélectionnées);
  }, [setValue]);

  useEffect(() => {
    if (!!!utilisateur && chantiersSélectionnables) {
      handleChangementValeursSélectionnéesChantiersSaisieIndicateurs(chantiersSélectionnables.map(c => c.id));
    }
  }, [chantiersSélectionnables, handleChangementValeursSélectionnéesChantiersSaisieIndicateurs, utilisateur]);


  const handleChangementValeursSélectionnéesPérimètresMinistérielsSaisieIndicateurs = useCallback((valeursSélectionnées: string[]) => {  
    const périmètresIdsActuellementsSélectionnés = getValues('habilitations.saisieIndicateur.périmètres') ?? [];
    const périmètresIdsDécochés = périmètresIdsActuellementsSélectionnés.filter(périmètreId => !valeursSélectionnées.includes(périmètreId));
    const chantiersIdsDesPérimètresDécochés = déterminerChantiersSélectionnésÀPartirDesPérimètresMinistériels(périmètresIdsDécochés);
    const chantiersIdsActuellementSélectionnés = getValues('habilitations.saisieIndicateur.chantiers') ?? [];
    const nouveauChantiersIds = chantiersIdsActuellementSélectionnés.filter(chantierId => !chantiersIdsDesPérimètresDécochés.includes(chantierId));
    setValue('habilitations.saisieIndicateur.chantiers', nouveauChantiersIds);
    setValue('habilitations.saisieIndicateur.périmètres', valeursSélectionnées);
    setChantiersIdsAppartenantsAuPérimètresMinistérielsSélectionnésSaisieIndicateurs(déterminerChantiersSélectionnésÀPartirDesPérimètresMinistériels(valeursSélectionnées));
  }, [déterminerChantiersSélectionnésÀPartirDesPérimètresMinistériels, getValues, setValue]);

  useEffect(() => {
    handleChangementValeursSélectionnéesChantiersSaisieIndicateurs([...getValues('habilitations.saisieIndicateur.chantiers') ?? [], ...chantiersIdsAppartenantsAuPérimètresMinistérielsSélectionnésSaisieIndicateurs]);
  }, [chantiersIdsAppartenantsAuPérimètresMinistérielsSélectionnésSaisieIndicateurs, getValues, handleChangementValeursSélectionnéesChantiersSaisieIndicateurs]);


  useEffect(() => {
    handleChangementValeursSélectionnéesPérimètresMinistérielsSaisieIndicateurs(getValues('habilitations.saisieIndicateur.périmètres'));
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
