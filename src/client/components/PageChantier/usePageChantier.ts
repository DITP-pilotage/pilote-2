import { useSession } from "next-auth/react";
import api from "@/server/infrastructure/api/trpc/api";
import { estAutoriséAImporterDesIndicateurs } from "@/client/utils/indicateur/indicateur";
import { estAutoriséAConsulterLaFicheConducteur } from "@/client/utils/fiche-conducteur/fiche-conducteur";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import {
  actionsTerritoiresStore,
  territoiresTerritoiresStore,
} from "@/stores/useTerritoiresStore/useTerritoiresStore";
import { PROFIL_AUTORISE_A_VOIR_LES_ALERTES_MAJ_INDICATEURS } from "@/client/components/_commons/IndicateursChantier/Bloc/useIndicateurAlerteDateMaj";
import { LISTE_PROFIL_TERRITORIALISE } from "@/server/app/domain/ProfilTerritorialise";
import { pageChantier } from "@/components/PageChantier/PageChantierServerSideContext";

const PROFIL_AUTORISE_A_VOIR_LES_PROPOSITIONS_DE_VALEUR_AVANCEMENT = new Set([
  ProfilEnum.DITP_ADMIN,
  ...LISTE_PROFIL_TERRITORIALISE,
]);

const PROFIL_INTERDIT_DE_VOIR_LE_SELECTEUR_DE_MAILLE = new Set([
  ProfilEnum.COORDINATEUR_DEPARTEMENT,
  ProfilEnum.RESPONSABLE_DEPARTEMENT,
]);

export const usePageChantier = () => {
  const { data: session } = useSession();
  const { chantier, territoireCode } = pageChantier.useServerSidePropsContext();

  const { récupérerDétailsSurUnTerritoire } = actionsTerritoiresStore();

  const territoireSélectionné = récupérerDétailsSurUnTerritoire(territoireCode);

  const territoires = territoiresTerritoiresStore();

  let estAutoriseAModifierLesPublications =
    territoireSélectionné.accèsSaisiePublication &&
    !!session?.habilitations["saisieCommentaire"].chantiers.includes(
      chantier.id,
    ) &&
    chantier.statut !== "ARCHIVE";

  const estAutoriseAProposerUneValeurAvancement =
    territoireCode !== "NAT-FR" &&
    PROFIL_AUTORISE_A_VOIR_LES_PROPOSITIONS_DE_VALEUR_AVANCEMENT.has(
      session!.profil,
    ) &&
    estAutoriseAModifierLesPublications &&
    chantier.statut !== "ARCHIVE";

  const estAutoriseAImporterSurLeChantier = !!session?.habilitations[
    "saisieIndicateur"
  ].chantiers.includes(chantier.id);

  const estAutoriseAAccepterLesPropositionsDeValeurAvancement =
    session?.profil != ProfilEnum.DITP_ADMIN &&
    territoireCode !== "NAT-FR" &&
    estAutoriseAImporterSurLeChantier &&
    chantier.statut !== "ARCHIVE";

  if (
    session &&
    [
      ProfilEnum.DIR_PROJET,
      ProfilEnum.EQUIPE_DIR_PROJET,
      ProfilEnum.SECRETARIAT_GENERAL,
    ].includes(session.profil) &&
    territoireSélectionné?.maille != "nationale"
  ) {
    estAutoriseAModifierLesPublications =
      estAutoriseAModifierLesPublications &&
      chantier?.ate === "hors_ate_centralise";
  }

  const estAutoriseAModifierLesObjectifs =
    territoires.some(
      (territoire) =>
        territoire.maille === "nationale" && territoire.accèsSaisiePublication,
    ) &&
    !!session?.habilitations["saisieCommentaire"].chantiers.includes(
      chantier.id,
    ) &&
    chantier.statut !== "ARCHIVE";

  const estAutoriseAImporterDesIndicateurs =
    estAutoriséAImporterDesIndicateurs(session!.profil) &&
    estAutoriseAImporterSurLeChantier &&
    chantier.statut !== "ARCHIVE";

  const { data: variableContenuFFFicheConducteur } =
    api.gestionContenu.récupérerVariableContenu.useQuery({
      nomVariableContenu: "NEXT_PUBLIC_FF_FICHE_CONDUCTEUR",
    });
  const estAutoriseAVoirLeBoutonFicheConducteur =
    !!variableContenuFFFicheConducteur &&
    estAutoriséAConsulterLaFicheConducteur(session!.profil);

  const estAutoriseAVoirLesAlertesMAJIndicateurs =
    PROFIL_AUTORISE_A_VOIR_LES_ALERTES_MAJ_INDICATEURS.has(session!.profil);

  const estAutoriseAVoirLeSelecteurDeMaille =
    !PROFIL_INTERDIT_DE_VOIR_LE_SELECTEUR_DE_MAILLE.has(session!.profil);

  return {
    estAutoriseAImporterDesIndicateurs,
    estAutoriseAVoirLeBoutonFicheConducteur,
    estAutoriseAProposerUneValeurAvancement,
    estAutoriseAAccepterLesPropositionsDeValeurAvancement,
    estAutoriseAModifierLesPublications,
    estAutoriseAModifierLesObjectifs,
    estAutoriseAVoirLesAlertesMAJIndicateurs,
    estAutoriseAVoirLeSelecteurDeMaille,
  };
};
