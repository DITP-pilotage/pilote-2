import { useFormContext } from 'react-hook-form';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { récupérerUnCookie } from '@/client/utils/cookies';
import api from '@/server/infrastructure/api/trpc/api';
import AlerteProps from '@/components/_commons/Alerte/Alerte.interface';
import { UtilisateurFormInputs } from '@/client/components/PageUtilisateurFormulaire/UtilisateurFormulaire/UtilisateurFormulaire.interface';
import { AAccesATousLesUtilisateurs } from '@/client/components/PageUtilisateurFormulaire/UtilisateurFormulaire/SaisieDesInformationsUtilisateur/useSaisieDesInformationsUtilisateur';

export default function useRécapitulatifUtilisateur() {

  const { getValues } = useFormContext<UtilisateurFormInputs>();
  const utilisateur = getValues();

  const { data: profils } = api.profil.récupérerTous.useQuery(undefined, { staleTime: Number.POSITIVE_INFINITY });
  const profilUtilisateur = profils?.find(profil => profil.code === utilisateur.profil);
  const saisieCommentaire = profilUtilisateur?.chantiers.saisieCommentaire.saisiePossible ?
    profilUtilisateur.chantiers.lecture.tous ? true : utilisateur.saisieCommentaire :
    false;
  const saisieIndicateur = profilUtilisateur?.chantiers.saisieIndicateur.tousTerritoires ?
    profilUtilisateur.chantiers.lecture.tous ? true : utilisateur.saisieIndicateur :
    false;
  const gestionUtilisateur = profilUtilisateur?.utilisateurs.modificationPossible ? 
    AAccesATousLesUtilisateurs(profilUtilisateur) ? true : utilisateur.gestionUtilisateur : 
    false;

  const utilisateurAAfficher = {
    ...utilisateur,
    gestionUtilisateur,
    saisieCommentaire,
    saisieIndicateur,
  };
  
  const router = useRouter();
  const [alerte, setAlerte] = useState<AlerteProps | null>(null);

  const mutationCréerUtilisateur = api.utilisateur.créer.useMutation({
    onSuccess: () => {
      router.push('/admin/utilisateurs?compteCréé=true');
    },
    onError: (error) => {
      if (error.data?.code === 'INTERNAL_SERVER_ERROR') {
        setAlerte({
          type: 'erreur',
          titre : error.message,
        });
      }
    },
  });

  const mutationModifierUtilisateur = api.utilisateur.modifier.useMutation({
    onSuccess: () => {
      router.push('/admin/utilisateurs?compteModifié=true');
    },
    onError: (error) => {
      if (error.data?.code === 'INTERNAL_SERVER_ERROR') {
        setAlerte({
          type: 'erreur',
          titre : error.message,
        });
      }
    },
  });

  const envoyerFormulaireUtilisateur = (utilisateurExistant: boolean) => {
    if (utilisateurExistant) 
      mutationModifierUtilisateur.mutate({ ...utilisateur, 'csrf': récupérerUnCookie('csrf') ?? '' });
    else
      mutationCréerUtilisateur.mutate({ ...utilisateur, 'csrf': récupérerUnCookie('csrf') ?? '' });
  };

  return {
    utilisateur: utilisateurAAfficher,
    envoyerFormulaireUtilisateur,
    alerte,
  };
}

