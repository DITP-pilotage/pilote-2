import { useRouter } from 'next/router';
import { Session } from 'next-auth';
import { récupérerUnCookie } from '@/client/utils/cookies';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';
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
  
  const modificationEstImpossible = (session: Session | null, utilisateurHabilitations: Habilitations) => {
    if (!session) {
      return false;
    }
    const habilitations = new Habilitation(session.habilitations);
    return !habilitations.peutAccéderAuxTerritoires(utilisateurHabilitations.lecture.territoires);
  };

  return {
    fermerLaModaleDeSuppressionUtilisateur,
    supprimerUtilisateur,
    modificationEstImpossible,
  };
}
