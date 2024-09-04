import { useSession } from 'next-auth/react';
import api from '@/server/infrastructure/api/trpc/api';
import { estAutoriséAImporterDesIndicateurs } from '@/client/utils/indicateur/indicateur';
import { estAutoriséAConsulterLaFicheConducteur } from '@/client/utils/fiche-conducteur/fiche-conducteur';
import { ProfilEnum } from '@/server/app/enum/profil.enum';
import { territoiresTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { DétailTerritoire } from '@/server/domain/territoire/Territoire.interface';

const PROFIL_AUTORISE_A_VOIR_LES_PROPOSITIONS_DE_VALEUR_ACTUELLE = new Set([
  ProfilEnum.DITP_ADMIN,
  ProfilEnum.PREFET_DEPARTEMENT,
  ProfilEnum.PREFET_REGION,
  ProfilEnum.COORDINATEUR_REGION,
  ProfilEnum.COORDINATEUR_DEPARTEMENT,
  ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
  ProfilEnum.SERVICES_DECONCENTRES_REGION,
]);

export default function usePageChantier(chantier: Chantier, territoireSélectionné: DétailTerritoire, territoireCode: string) {
  const { data: session } = useSession();
  const territoires = territoiresTerritoiresStore();

  let estAutoriseAModifierLesPublications = territoireSélectionné!.accèsSaisiePublication && !!session?.habilitations['saisieCommentaire'].chantiers.includes(chantier.id);

  const estAutoriseAProposerUneValeurActuelle = territoireCode !== 'NAT-FR' && PROFIL_AUTORISE_A_VOIR_LES_PROPOSITIONS_DE_VALEUR_ACTUELLE.has(session!.profil) && estAutoriseAModifierLesPublications;

  if (session && [ProfilEnum.DIR_PROJET, ProfilEnum.EQUIPE_DIR_PROJET, ProfilEnum.SECRETARIAT_GENERAL].includes(session.profil) && territoireSélectionné?.maille != 'nationale') {
    estAutoriseAModifierLesPublications = estAutoriseAModifierLesPublications && chantier?.ate === 'hors_ate_centralise';
  }

  const estAutoriseAModifierLesObjectifs = territoires.some(territoire => territoire.maille === 'nationale' && territoire.accèsSaisiePublication) && !!session?.habilitations['saisieCommentaire'].chantiers.includes(chantier.id);


  const estAutoriseAImporterDesIndicateurs = estAutoriséAImporterDesIndicateurs(session!.profil) && !!session?.habilitations['saisieIndicateur'].chantiers.includes(chantier.id);

  const { data: variableContenuFFFicheConducteur } = api.gestionContenu.récupérerVariableContenu.useQuery({ nomVariableContenu: 'NEXT_PUBLIC_FF_FICHE_CONDUCTEUR' });
  const estAutoriseAVoirLeBoutonFicheConducteur = !!variableContenuFFFicheConducteur && estAutoriséAConsulterLaFicheConducteur(session!.profil);

  return {
    estAutoriseAImporterDesIndicateurs,
    estAutoriseAVoirLeBoutonFicheConducteur,
    estAutoriseAProposerUneValeurActuelle,
    estAutoriseAModifierLesPublications,
    estAutoriseAModifierLesObjectifs,
  };
}
