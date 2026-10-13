import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Dialog } from "radix-ui";
import { keepPreviousData } from "@tanstack/react-query";
import { Session } from "next-auth";
import { api } from "@/server/framework/trpc/api";
import { useEnv } from "@/client/hooks/useEnv";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { BoutonContacterEquipePilote } from "@/components/PageAccueil/BoutonContacterEquipePilote";
import {
  IdentiteMenuMobile,
  MonEspaceMenuMobile,
} from "@/components/_commons/MiseEnPage/EnTete/Utilisateur/Utilisateur";
import { ProfilEnum } from "@/shared/profil/ProfilEnum";
import { Button } from "@/components/shared/Button";
import { Icone } from "@/components/_commons/Icone";
import { CloseLineIcon } from "@/components/_commons/Icones/CloseLineIcon";
import { useMenuMobile } from "@/components/_commons/MiseEnPage/EnTete/MenuMobileContext";
import { clsxm } from "@/utils/clsxm";
import {
  CLASSES_NAV,
  CLASSES_NAV_ELEMENT,
  CLASSES_NAV_LIEN,
  CLASSES_NAV_LISTE,
  CLASSES_NAV_LISTE_EN_TETE,
} from "./navigationClasses";

const estAutoriséAParcourirSiIndisponible = (session: Session | null) =>
  session?.profil === ProfilEnum.DITP_ADMIN;

export const useNavigation = () => {
  const applicationEstDisponible = useEnv(
    "NEXT_PUBLIC_FF_APPLICATION_INDISPONIBLE",
  );

  return {
    vérifierValeurApplicationEstIndisponible: applicationEstDisponible,
  };
};

export type LienNavigation = {
  nom: string;
  lien: string;
  matcher: string;
  accessible?: boolean;
  prefetch: boolean;
  target: string;
};

export const BaseNavigation = ({ pages }: { pages: LienNavigation[] }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const urlActuelle = router.pathname;

  const { vérifierValeurApplicationEstIndisponible } = useNavigation();
  const { open: menuOuvert, setOpen: setMenuOuvert } = useMenuMobile();

  if (
    vérifierValeurApplicationEstIndisponible &&
    !estAutoriséAParcourirSiIndisponible(session) &&
    urlActuelle !== "/503"
  ) {
    router.push("/503");
  }

  const { data: listerNouveautes } = api.parametrageNouveautes.lister.useQuery(
    undefined,
    {
      placeholderData: keepPreviousData,
    },
  );

  const aConsulteLaDerniereNouveaute =
    listerNouveautes && listerNouveautes[0]
      ? récupérerUnCookie("derniereVersionNouveauteConsulte") ===
        listerNouveautes[0].version
      : true;

  const navigationAccessible =
    !vérifierValeurApplicationEstIndisponible ||
    estAutoriséAParcourirSiIndisponible(session);

  const listeDesLiens = (dansEnTete: boolean, onNavigate?: () => void) =>
    navigationAccessible ? (
      <ul
        className={clsxm(
          CLASSES_NAV_LISTE,
          dansEnTete && CLASSES_NAV_LISTE_EN_TETE,
        )}
      >
        {pages.map(
          (page) =>
            page.accessible && (
              <li className={CLASSES_NAV_ELEMENT} key={page.lien}>
                <Link
                  aria-current={
                    page.matcher === urlActuelle ? "true" : undefined
                  }
                  className={clsxm(CLASSES_NAV_LIEN, "relative")}
                  href={page.lien}
                  onClick={onNavigate}
                  target={page.target}
                >
                  <span className="relative">
                    {page.nom}
                    {page.matcher === "/nouveautes" &&
                    !aConsulteLaDerniereNouveaute ? (
                      <span
                        aria-hidden
                        className="absolute -right-2.5 -top-1 text-[0.625rem] leading-none text-error"
                      >
                        ●
                      </span>
                    ) : null}
                  </span>
                </Link>
              </li>
            ),
        )}
      </ul>
    ) : null;

  return (
    <>
      <div className="max-[61.99em]:hidden lg:shadow-[inset_0_1px_0_0_var(--border-default-grey)] print:hidden">
        <div className="fr-container">
          <nav aria-label="Menu principal" className={CLASSES_NAV}>
            {listeDesLiens(true)}
          </nav>
        </div>
      </div>
      <Dialog.Root onOpenChange={setMenuOuvert} open={menuOuvert}>
        <Dialog.Portal>
          <Dialog.Content
            aria-describedby={undefined}
            className="fixed inset-0 z-[1000] overflow-y-auto bg-white px-4 pb-8 min-[62em]:hidden"
          >
            <Dialog.Title className="sr-only">Menu principal</Dialog.Title>
            <div className="flex items-start justify-between gap-4 py-4">
              <IdentiteMenuMobile />
              <Dialog.Close asChild>
                <Button
                  className="shrink-0"
                  iconRight={
                    <Icone
                      className="w-4 h-4 text-current"
                      icone={CloseLineIcon}
                    />
                  }
                  size="sm"
                  variant="tertiary-no-outline"
                >
                  Fermer
                </Button>
              </Dialog.Close>
            </div>
            <div className="border-b border-b-gray-200 pb-3">
              <BoutonContacterEquipePilote />
            </div>
            <MonEspaceMenuMobile onNavigate={() => setMenuOuvert(false)} />
            <nav aria-label="Menu principal" className={CLASSES_NAV}>
              {listeDesLiens(false, () => setMenuOuvert(false))}
            </nav>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
};
