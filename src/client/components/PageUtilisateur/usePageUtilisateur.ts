import { useRouter } from 'next/router';
import { Session } from 'next-auth';
import { récupérerUnCookie } from '@/client/utils/cookies';
import Utilisateur, { ProfilCode } from '@/server/domain/utilisateur/Utilisateur.interface';
import api from '@/server/infrastructure/api/trpc/api';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';

export default function usePageUtilisateur(utilisateur: Utilisateur) {

  const router = useRouter();

  const mutationSupprimerUtilisateur = api.utilisateur.supprimer.useMutation({
    onSuccess: () => {
      router.push('/admin/utilisateurs?compteSupprimé=true');
    },
  });

  // eslint-disable-next-line unicorn/consistent-function-scoping
  const fermerLaModaleDeSuppressionUtilisateur = () => {
    if (typeof window.dsfr === 'function') {
      window.dsfr(document.querySelector<HTMLElement>('#supprimer-compte'))?.modal?.conceal();
    }
  };

  const supprimerUtilisateur = () => {
    mutationSupprimerUtilisateur.mutate({ email: utilisateur.email, 'csrf': récupérerUnCookie('csrf') ?? '' });
  };
  
  const modificationEstImpossible = (session: Session | null, utilisateurHabilitations: Habilitations, utilisateurProfil: ProfilCode) => {
    if (!session) {
      return true;
    }

    if (['DITP_ADMIN', 'DITP_PILOTAGE'].includes(session.profil)) {
      return false;
    }

    const habilitations = new Habilitation(session.habilitations);
    return !habilitations.peutAccéderAuxTerritoires(utilisateurHabilitations.lecture.territoires) || ['REFERENT_REGION', 'REFERENT_DEPARTEMENT'].includes(utilisateurProfil);
  };

  const donnneContenuBandeau = (session: Session | null, utilisateurHabilitations: Habilitations, utilisateurProfil: ProfilCode) => {
    if (!session) {
      return '';
    }

    const habilitations = new Habilitation(session.habilitations);

    if (!habilitations.peutAccéderAuxTerritoires(utilisateurHabilitations.lecture.territoires)) {
      return "Ce compte a des droits d'accès sur plusieurs territoires. Vous ne pouvez pas modifier ses droits ou supprimer l'utilisateur. Si vous avez besoin d’aide, veuillez contacter le support technique.";
    } else if (['REFERENT_REGION', 'REFERENT_DEPARTEMENT'].includes(utilisateurProfil)) {
      return "Ce compte a un profil de référent PILOTE. Vous ne pouvez le modifier ou le supprimer. Si vous avez besoin d'aide, veuillez contacter le support technique.";
    } else {
      return '';
    }
  };  

  return {
    fermerLaModaleDeSuppressionUtilisateur,
    supprimerUtilisateur,
    modificationEstImpossible,
    donnneContenuBandeau,
  };
}
