import "@gouvfr/dsfr/dist/component/header/header.min.css";
import "@gouvfr/dsfr/dist/component/logo/logo.min.css";
import { useSession } from "next-auth/react";
import { Navigation } from "@/components/_commons/MiseEnPage/Navigation/Navigation";
import { Utilisateur } from "@/components/_commons/MiseEnPage/EnTete/Utilisateur/Utilisateur";
import { Notice } from "@/components/shared/Notice";
import { api } from "@/server/framework/trpc/api";
import { BoutonContacterEquipePilote } from "@/components/PageAccueil/BoutonContacterEquipePilote";
import { BoutonSeConnecter } from "@/components/_commons/BoutonSeConnecter";
import { BoutonApplicationsPilote } from "@/components/_commons/MiseEnPage/EnTete/BoutonApplicationsPilote";
import { ClientOnly } from "@/components/shared/ClientOnly";
import { LogoPilote } from "@/components/_commons/LogoPilote";
import { useEnv } from "@/client/hooks/useEnv";
import { Button } from "@/components/shared/Button";
import { Icone } from "@/components/_commons/Icone";
import { MenuFillIcon } from "@/components/_commons/Icones/MenuFillIcon";
import { MenuMobileProvider, useMenuMobile } from "./MenuMobileContext";

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

const BoutonMenuMobile = () => {
  const { setOpen } = useMenuMobile();
  return (
    <Button
      aria-label="Menu"
      className="ml-auto min-[62em]:hidden"
      iconLeft={<Icone className="w-5 h-5 text-current" icone={MenuFillIcon} />}
      onClick={() => setOpen(true)}
      title="Menu"
      variant="tertiary"
    />
  );
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
    <MenuMobileProvider>
      <header className="fr-header z-[2] print:hidden" role="banner">
        <div className="fr-header__body">
          <div className="fr-container">
            <div className="fr-header__body-row">
              <div className="fr-header__brand fr-enlarge-link">
                <div className="fr-header__brand-top fr-grid-row">
                  <LogoPilote />
                  {!!session ? (
                    <div className="fr-header__navbar fr-col-2 fr-col-md-1 fr-lg-col-0">
                      <BoutonMenuMobile />
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="fr-header__tools">
                <div className="hidden min-[62em]:flex min-[62em]:flex-row min-[62em]:justify-end min-[62em]:gap-2">
                  <div className="flex items-center gap-4">
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
          <Notice
            dismissible
            title={bandeauTexte}
            variant={bandeauType === "INFO" ? "info" : "warning"}
          />
        ) : null}
      </header>
    </MenuMobileProvider>
  );
};
