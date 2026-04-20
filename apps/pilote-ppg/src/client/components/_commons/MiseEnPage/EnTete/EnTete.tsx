import "@gouvfr/dsfr/dist/component/header/header.min.css";
import "@gouvfr/dsfr/dist/component/logo/logo.min.css";
import { useSession } from "next-auth/react";
import { Navigation } from "@/components/_commons/MiseEnPage/Navigation/Navigation";
import { Utilisateur } from "@/components/_commons/MiseEnPage/EnTete/Utilisateur/Utilisateur";
import BandeauInformation from "@/components/_commons/BandeauInformation/BandeauInformation";
import api from "@/server/infrastructure/api/trpc/api";
import { BoutonContacterEquipePilote } from "@/components/PageAccueil/BoutonContacterEquipePilote";
import { BoutonSeConnecter } from "@/components/_commons/BoutonSeConnecter";
import { BoutonApplicationsPilote } from "@/components/_commons/MiseEnPage/EnTete/BoutonApplicationsPilote";
import { ClientOnly } from "@/components/shared/ClientOnly";
import { LogoPilote } from "@/components/_commons/LogoPilote";
import { useEnv } from "@/client/hooks/useEnv";

const InformationsEspaceConnecte = () => {
  const { data: session } = useSession();
  const ffPiloteEval = useEnv("NEXT_PUBLIC_FF_PILOTE_EVAL");
  const ffAccesPilote = useEnv("NEXT_PUBLIC_FF_ACCES_PILOTE");

  const peutVoirLeBoutonApplicationsPilote =
    ffPiloteEval && (ffAccesPilote || session?.profil === "DITP_ADMIN");

  if (session?.user != null)
    return (
      <>
        {peutVoirLeBoutonApplicationsPilote ? (
          <BoutonApplicationsPilote />
        ) : null}
        <Utilisateur />
      </>
    );

  return <BoutonSeConnecter />;
};

const useEntete = () => {
  const { data: messageInformation } =
    api.gestionContenu.recupererMessageInformation.useQuery();
  return {
    messageInformation,
  };
};

export const EnTete = () => {
  const { data: session } = useSession();
  const { messageInformation } = useEntete();

  const isBandeauActif = messageInformation?.isBandeauActif || false;
  const bandeauTexte =
    messageInformation?.bandeauTexte ||
    "Des opérations de maintenance sont en cours et peuvent perturber le fonctionnement normal de PILOTE. En cas de difficultés : pilote.ditp@modernisation.gouv.fr";
  const bandeauType = messageInformation?.bandeauType || "WARNING";

  return (
    <header className="fr-header z-[2] print:hidden" role="banner">
      <div className="fr-header__body">
        <div className="fr-container">
          <div className="fr-header__body-row">
            <div className="fr-header__brand fr-enlarge-link">
              <div className="fr-header__brand-top fr-grid-row">
                <LogoPilote />
                {!!session ? (
                  <div className="fr-header__navbar fr-col-2 fr-col-md-1 fr-lg-col-0">
                    <button
                      aria-controls="modale-menu-principal"
                      aria-haspopup="menu"
                      className="fr-btn--menu fr-btn"
                      data-fr-opened="false"
                      id="bouton-menu-principal"
                      title="Menu"
                      type="button"
                    >
                      Menu
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="fr-header__tools">
              <div className="fr-header__tools-links">
                <div className="flex align-center gap-4">
                  <BoutonContacterEquipePilote />
                  <ClientOnly>
                    <InformationsEspaceConnecte />
                  </ClientOnly>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {session?.user ? (
        <ClientOnly>
          <Navigation />
        </ClientOnly>
      ) : null}
      {isBandeauActif ? (
        <BandeauInformation bandeauType={bandeauType}>
          {bandeauTexte}
        </BandeauInformation>
      ) : null}
    </header>
  );
};
