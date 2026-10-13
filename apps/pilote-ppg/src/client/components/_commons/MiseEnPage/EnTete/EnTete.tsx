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
      <header
        className="relative z-[2] w-full [--li-bottom:0] [--ol-content:none] [--ol-start:0] [--ol-type:none] [--text-spacing:0] [--title-spacing:0] [--ul-start:0] [--ul-type:none] [--underline-img:none] [--xl-block:0] lg:[background-color:var(--background-raised-grey)] lg:[filter:drop-shadow(var(--raised-shadow))] lg:[--active:var(--background-raised-grey-active)] lg:[--hover:var(--background-raised-grey-hover)] lg:[--idle:transparent] print:hidden"
        role="banner"
      >
        <div>
          <div className="fr-container">
            <div className="-mx-4 flex flex-row items-center justify-start lg:py-6 print:p-0">
              <div className="fr-enlarge-link z-[calc(var(--ground)+750)] flex w-full flex-row flex-wrap items-center justify-start px-1 [background-color:var(--background-raised-grey)] [filter:drop-shadow(var(--raised-shadow))] [--active:var(--background-raised-grey-active)] [--hover:var(--background-raised-grey-hover)] [--idle:transparent] after:relative after:z-[1] after:block after:flex-1 after:self-stretch after:content-[''] [&_a[href]]:before:[outline-offset:-2px] lg:-my-4 lg:z-auto lg:w-auto lg:flex-nowrap lg:px-0 lg:[background:transparent] lg:[filter:none] lg:[&_a[href]]:before:[outline-offset:2px] print:flex-nowrap">
                <div className="fr-grid-row flex w-full flex-row items-center justify-start overflow-hidden lg:w-auto print:w-auto">
                  <LogoPilote />
                  {!!session ? (
                    <div className="fr-col-2 fr-col-md-1 z-[calc(var(--ground)+1000)] order-3 -mr-2 mt-1 flex flex-1 flex-row items-start justify-end self-stretch p-1 lg:hidden print:hidden">
                      <BoutonMenuMobile />
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="lg:ml-auto lg:flex-[1_0_auto] lg:flex-col lg:items-end lg:px-4 lg:text-right print:hidden">
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
