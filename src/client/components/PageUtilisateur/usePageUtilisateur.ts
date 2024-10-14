import { useRouter } from 'next/router';
import { Session } from 'next-auth';
import { récupérerUnCookie } from '@/client/utils/cookies';
import Utilisateur, { ProfilCode } from '@/server/domain/utilisateur/Utilisateur.interface';
import api from '@/server/infrastructure/api/trpc/api';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { ProfilEnum } from '@/server/app/enum/profil.enum';

const PROFIL_AUTORISE_A_POSSEDER_UN_TOKEN_API = new Set([ProfilEnum.DITP_ADMIN, ProfilEnum.DIR_PROJET, ProfilEnum.EQUIPE_DIR_PROJET, ProfilEnum.SECRETARIAT_GENERAL, ProfilEnum.COORDINATEUR_REGION, ProfilEnum.COORDINATEUR_DEPARTEMENT]);

export default function usePageUtilisateur(utilisateur: Utilisateur) {

  const router = useRouter();

  const { data: tokenAPIEstDisponible } = api.gestionContenu.récupérerVariableContenu.useQuery({ nomVariableContenu: 'NEXT_PUBLIC_FF_GESTION_TOKEN_API' });

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

    if ([ProfilEnum.DITP_ADMIN, ProfilEnum.DITP_PILOTAGE].includes(session.profil)) {
      return false;
    }

    const habilitations = new Habilitation(session.habilitations);
    return !habilitations.peutAccéderAuxTerritoiresUtilisateurs(utilisateurHabilitations.lecture.territoires) || [ProfilEnum.COORDINATEUR_REGION, ProfilEnum.COORDINATEUR_DEPARTEMENT].includes(utilisateurProfil);
  };

  const donnneContenuBandeau = (session: Session | null, utilisateurHabilitations: Habilitations, utilisateurProfil: ProfilCode) => {
    if (!session) {
      return '';
    }

    const habilitations = new Habilitation(session.habilitations);

    if (!habilitations.peutAccéderAuxTerritoiresUtilisateurs(utilisateurHabilitations.lecture.territoires)) {
      return "Ce compte a des droits d'accès sur plusieurs territoires. Vous ne pouvez pas modifier ses droits ou supprimer l'utilisateur. Si vous avez besoin d’aide, veuillez contacter le support technique.";
    } else if ([ProfilEnum.COORDINATEUR_REGION, ProfilEnum.COORDINATEUR_DEPARTEMENT].includes(utilisateurProfil)) {
      return "Ce compte a un profil de coordinateur PILOTE. Vous ne pouvez le modifier ou le supprimer. Si vous avez besoin d'aide, veuillez contacter le support technique.";
    } else {
      return '';
    }
  };  

  const habilitationsAGenererUnTokenDAuthentification = (session: Session, utilisateurProfil: ProfilCode) => {
    const PROFIL_ADMIN_AUTORISE_A_MODIFIER = new Set([ProfilEnum.DITP_ADMIN]);

    return !(!session || !PROFIL_ADMIN_AUTORISE_A_MODIFIER.has(session.profil) || !PROFIL_AUTORISE_A_POSSEDER_UN_TOKEN_API.has(utilisateurProfil));
  };

  return {
    fermerLaModaleDeSuppressionUtilisateur,
    supprimerUtilisateur,
    modificationEstImpossible,
    donnneContenuBandeau,
    habilitationsAGenererUnTokenDAuthentification,
    vérifierFFTokenAPIEstDisponible: tokenAPIEstDisponible,
  };
}
