import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Link from "next/link";
import { keepPreviousData } from "@tanstack/react-query";
import { $Enums } from "@prisma/client";
import { Session } from "next-auth";
import api from "@/server/infrastructure/api/trpc/api";
import { useCurrentApplication } from "@/client/hooks/useCurrentApplication";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { BoutonContacterEquipePilote } from "@/components/PageAccueil/BoutonContacterEquipePilote";
import { Utilisateur } from "@/components/_commons/MiseEnPage/EnTete/Utilisateur/Utilisateur";
import MenuItemGestionContenu from "@/components/_commons/MiseEnPage/Navigation/MenuItemGestionContenu";
import { ProfilEnum } from "@/server/app/enum/profil.enum";

const fermerLaModaleDuMenu = () => {
  if (typeof window.dsfr === "function") {
    window
      .dsfr(document.querySelector<HTMLElement>("#modale-menu-principal"))
      ?.modal?.conceal();
  }
};

const estAutoriséAParcourirSiIndisponible = (session: Session | null) =>
  session?.profil === ProfilEnum.DITP_ADMIN;

const estAdministrateur = (session: Session | null) =>
  session?.profil === ProfilEnum.DITP_ADMIN;

export const useNavigation = () => {
  const { data: applicationEstDisponible } =
    api.gestionContenu.recupererVariableContenu.useQuery({
      nomVariableContenu: "NEXT_PUBLIC_FF_APPLICATION_INDISPONIBLE",
    });
  const { data: suiviCompletudeEstDisponible } =
    api.gestionContenu.recupererVariableContenu.useQuery({
      nomVariableContenu: "NEXT_PUBLIC_FF_SUIVI_COMPLETUDE",
    });

  return {
    vérifierValeurApplicationEstIndisponible: applicationEstDisponible,
    vérifierSuiviCompletudeEstDisponibleEstIndisponible:
      suiviCompletudeEstDisponible,
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
  const currentApplication = useCurrentApplication();

  const router = useRouter();
  const urlActuelle = router.pathname;

  const { vérifierValeurApplicationEstIndisponible } = useNavigation();

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

  return (
    <div
      aria-labelledby="bouton-menu-principal"
      className="fr-header__menu fr-modal"
      id="modale-menu-principal"
    >
      <div className="fr-container">
        <button
          aria-controls="modale-menu-principal"
          className="fr-btn--close fr-btn"
          title="Fermer"
          type="button"
        >
          Fermer
        </button>
        <div className="fr-header__menu-links gap-2 divide-y divide-gray-200 border-b border-b-gray-200 pb-2">
          <div className="pb-2">
            <BoutonContacterEquipePilote />
          </div>
          <div className="flex">
            <Utilisateur />
          </div>
        </div>
        <nav
          aria-label="Menu principal"
          className="fr-nav"
          id="navigation-menu-principal"
          role="navigation"
        >
          {!vérifierValeurApplicationEstIndisponible ||
          (vérifierValeurApplicationEstIndisponible &&
            estAutoriséAParcourirSiIndisponible(session)) ? (
            <ul className="fr-nav__list">
              {pages.map(
                (page) =>
                  page.accessible && (
                    <li className="fr-nav__item" key={page.lien}>
                      <Link
                        aria-current={
                          page.matcher === urlActuelle ? "true" : undefined
                        }
                        className="fr-nav__link relative"
                        href={page.lien}
                        onClick={fermerLaModaleDuMenu}
                        target={page.target}
                      >
                        {page.nom}
                        {page.matcher === "/nouveautes" &&
                        !aConsulteLaDerniereNouveaute ? (
                          <span className="!text-error fr-pl-1v absolute fr-top-1v">
                            ●
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  ),
              )}
              {currentApplication === $Enums.application_accessible.PILOTE &&
              estAdministrateur(session) ? (
                <MenuItemGestionContenu urlActuelle={urlActuelle} />
              ) : null}
            </ul>
          ) : null}
        </nav>
      </div>
    </div>
  );
};
