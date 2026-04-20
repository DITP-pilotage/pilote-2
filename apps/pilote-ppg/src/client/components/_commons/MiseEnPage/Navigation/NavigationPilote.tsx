import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { Session } from "next-auth";
import {
  FiltreAccueil,
  getFiltresActifs,
} from "@/stores/useFiltresStoreNew/useFiltresStoreNew";
import { getQueryParamString } from "@/client/utils/getQueryParamString";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import Habilitation from "@/server/domain/utilisateur/habilitation/Habilitation";
import HabilitationGestionUtilisateur from "@/server/gestion-utilisateur/domain/habilitation/Habilitation";
import { useEnv } from "@/client/hooks/useEnv";
import {
  BaseNavigation,
  LienNavigation,
  useNavigation,
} from "./BaseNavigation";

const estAutoriséAAccéderALaGestionDesComptes = (session: Session | null) => {
  if (!session) {
    return false;
  }
  const habilitations = new Habilitation(session.habilitations);
  return habilitations.peutCréerEtModifierUnUtilisateur();
};

const estAdministrateurOuPilotage = (session: Session) => {
  return [ProfilEnum.DITP_ADMIN, ProfilEnum.DITP_PILOTAGE].includes(
    session?.profil,
  );
};

const estAutoriseAAccederAuxRapportsHebdomadaires = (
  session: Session | null,
) => {
  if (!session) {
    return false;
  }
  const habilitation = new HabilitationGestionUtilisateur({
    habilitations: session.habilitations,
    profil: session.profil,
  });
  return habilitation.estAutoriseAAccederAuxRapportsHebdomadaires();
};

export const NavigationPilote = () => {
  const { data: session } = useSession();
  const router = useRouter();

  const ffRapportCoordinateurs = useEnv("NEXT_PUBLIC_FF_RAPPORT_COORDINATEURS");
  const ffCentreAidePilote = useEnv("NEXT_PUBLIC_FF_CENTRE_AIDE_PILOTE");
  const { vérifierSuiviCompletudeEstDisponibleEstIndisponible } =
    useNavigation();

  const filtresActifs = getFiltresActifs();

  const territoireCodeURL = router.query.territoireCode as string | undefined;
  const jalonUrl = router.query.jalon as string | undefined;

  const init: Partial<FiltreAccueil> = {
    jalon: jalonUrl,
  };

  const territoireCodeStore = Boolean(filtresActifs?.territoireCode)
    ? filtresActifs.territoireCode
    : session?.habilitations.lecture.territoires.includes("NAT-FR")
      ? "NAT-FR"
      : session?.habilitations.lecture.territoires[0];
  const territoireCode = territoireCodeURL ?? territoireCodeStore;

  const queryParamString = getQueryParamString(
    filtresActifs,
    new Set(["territoireCode"]),
    init,
  );

  return (
    <BaseNavigation
      pages={[
        {
          nom: "Accueil",
          lien: `/accueil/chantier/${territoireCode}${queryParamString.length > 0 ? `?${queryParamString}` : ""}`,
          matcher: "/accueil/chantier/[territoireCode]",
          accessible: true,
          prefetch: true,
          target: "_self",
        } as LienNavigation,
        {
          nom: "Mes rapports",
          lien: "/rapports-hebdomadaires",
          matcher: "/rapports-hebdomadaires",
          accessible:
            estAutoriseAAccederAuxRapportsHebdomadaires(session) &&
            ffRapportCoordinateurs,
          prefetch: false,
          target: "_self",
        },
        {
          nom: "Gestion des comptes",
          lien: "/admin/utilisateurs",
          matcher: "/admin/utilisateurs",
          accessible: estAutoriséAAccéderALaGestionDesComptes(session),
          prefetch: false,
          target: "_self",
        },
        {
          nom: "Nouveautés",
          lien: "/nouveautes",
          matcher: "/nouveautes",
          accessible: true,
          prefetch: false,
          target: "_self",
        },
        {
          nom: "Centre d'aide",
          lien: "/centre-aide-pilote-2/centre-aide",
          matcher: "/centre-aide-pilote-2/centre-aide",
          accessible: true,
          prefetch: false,
          target: "_blank",
        },
        {
          nom: "Centre d'aide Pilote",
          lien: "/centre-aide-pilote",
          matcher: "/centre-aide-pilote",
          accessible: ffCentreAidePilote,
          prefetch: false,
          target: "_self",
        },
        {
          nom: "Suivi de la complétude",
          lien: "https://copilot-metabase.osc-secnum-fr1.scalingo.io/dashboard/39-tableau-de-bord-de-conformite-pilote",
          matcher: "/suivicompletude",
          accessible:
            Boolean(vérifierSuiviCompletudeEstDisponibleEstIndisponible) &&
            estAdministrateurOuPilotage(session!),
          prefetch: false,
          target: "_blank",
        },
      ]}
    />
  );
};
