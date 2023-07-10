import { useRouter } from 'next/router';
import { récupérerUnCookie } from '@/client/utils/cookies';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';
import api from '@/server/infrastructure/api/trpc/api';

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

  return {
    fermerLaModaleDeSuppressionUtilisateur,
    supprimerUtilisateur,
  };
}
