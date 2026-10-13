import { useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Icone } from "@/components/_commons/Icone";
import { Account1Icon } from "@/components/_commons/Icones/Account1Icon";
import { ArrowSLine1Icon } from "@/components/_commons/Icones/ArrowSLine1Icon";
import { BoutonSeDeconnecter } from "@/components/_commons/BoutonSeDeconnecter";
import { clsxm } from "@/utils/clsxm";
import { Dropdown } from "@/components/shared/Dropdown";
import { Collapsible } from "@/components/shared/Collapsible";
import { useProfilUtilisateurConnecte } from "@/client/hooks/useProfilUtilisateurConnecte";
import { Settings1Icon } from "@/components/_commons/Icones/Settings1Icon";
import { ProfilEnum } from "@/shared/profil/ProfilEnum";
import {
  CLASSES_NAV,
  CLASSES_NAV_BOUTON,
  CLASSES_NAV_ELEMENT,
  CLASSES_NAV_LIEN,
  CLASSES_NAV_LISTE,
} from "@/components/_commons/MiseEnPage/Navigation/navigationClasses";

const peutAccederPanelAdministrateur = (
  session: ReturnType<typeof useSession>,
) => [ProfilEnum.DITP_ADMIN].includes(session.data?.profil);

export const Utilisateur = () => {
  const [estDeplie, setEstDeplie] = useState<boolean>(false);
  const session = useSession();
  const { email, prenom, nom } = useProfilUtilisateurConnecte();

  const showPanelAdministrateur = peutAccederPanelAdministrateur(session);

  return (
    <Dropdown.Root onOpenChange={setEstDeplie} open={estDeplie}>
      <Dropdown.Trigger asChild>
        <button
          className="flex items-center text-sm p-0 text-primary"
          name="Utilisateur connecté"
          type="button"
        >
          <Icone icone={Account1Icon} />
          <span className="pl-2 pr-1">Mon espace</span>
          <Icone
            className={clsxm(
              "transition-transform duration-200 ease-in-out",
              estDeplie ? "rotate-90" : "rotate-0",
            )}
            icone={ArrowSLine1Icon}
          />
        </button>
      </Dropdown.Trigger>
      <Dropdown.Content align="end" className="flex flex-col gap-4">
        <div className="flex flex-col">
          <span className="font-bold text-base">
            {prenom} {nom}
          </span>
          <span className="text-sm">{email}</span>
        </div>

        <Dropdown.Divider />

        <Dropdown.Item asChild>
          <Link href="/mon-profil-utilisateur">
            <Dropdown.Icone icone={Account1Icon} />
            Mon profil utilisateur
          </Link>
        </Dropdown.Item>
        {showPanelAdministrateur ? (
          <Dropdown.Item asChild>
            <Link href="/panel-administrateur/parametrage-metadata-indicateur">
              <Dropdown.Icone icone={Settings1Icon} />
              Panel administrateur
            </Link>
          </Dropdown.Item>
        ) : null}

        <Dropdown.Divider />

        <BoutonSeDeconnecter />
      </Dropdown.Content>
    </Dropdown.Root>
  );
};

// Version du menu mobile : sous-menu dépliable dans le flux, au style des liens
// de navigation, plutôt qu'un menu flottant qui recouvrirait le menu plein écran.
export const IdentiteMenuMobile = () => {
  const { email, prenom, nom } = useProfilUtilisateurConnecte();
  return (
    <div className="min-w-0">
      <p className="mb-0 truncate text-base font-bold text-dsfr-grey-50">
        {prenom} {nom}
      </p>
      <p className="mb-0 truncate text-sm text-dsfr-mention-grey">{email}</p>
    </div>
  );
};

export const MonEspaceMenuMobile = ({
  onNavigate,
}: {
  onNavigate: () => void;
}) => {
  const session = useSession();
  const showPanelAdministrateur = peutAccederPanelAdministrateur(session);

  return (
    <nav aria-label="Mon espace" className={CLASSES_NAV}>
      <ul className={CLASSES_NAV_LISTE}>
        <li className={CLASSES_NAV_ELEMENT}>
          <Collapsible.Root>
            <Collapsible.Trigger className={CLASSES_NAV_BOUTON} type="button">
              Mon espace
            </Collapsible.Trigger>
            <Collapsible.Content>
              <ul className="list-none p-0 pl-4">
                <li>
                  <Link
                    className={CLASSES_NAV_LIEN}
                    href="/mon-profil-utilisateur"
                    onClick={onNavigate}
                  >
                    Mon profil utilisateur
                  </Link>
                </li>
                {showPanelAdministrateur ? (
                  <li>
                    <Link
                      className={CLASSES_NAV_LIEN}
                      href="/panel-administrateur/parametrage-metadata-indicateur"
                      onClick={onNavigate}
                    >
                      Panel administrateur
                    </Link>
                  </li>
                ) : null}
                <li>
                  <button
                    className={clsxm(CLASSES_NAV_LIEN, "w-full text-left")}
                    onClick={() => signOut()}
                    type="button"
                  >
                    Se déconnecter
                  </button>
                </li>
              </ul>
            </Collapsible.Content>
          </Collapsible.Root>
        </li>
      </ul>
    </nav>
  );
};
