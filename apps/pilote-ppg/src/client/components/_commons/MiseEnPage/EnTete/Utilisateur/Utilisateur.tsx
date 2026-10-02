import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Icone } from "@/components/_commons/Icone";
import { Account1Icon } from "@/components/_commons/Icones/Account1Icon";
import { ArrowSLine1Icon } from "@/components/_commons/Icones/ArrowSLine1Icon";
import { BoutonSeDeconnecter } from "@/components/_commons/BoutonSeDeconnecter";
import { clsxm } from "@/utils/clsxm";
import { Dropdown } from "@/components/shared/Dropdown";
import { Collapsible } from "@/components/shared/Collapsible";
import { useProfilUtilisateurConnecte } from "@/client/hooks/useProfilUtilisateurConnecte";
import { Settings1Icon } from "@/components/_commons/Icones/Settings1Icon";
import { ProfilEnum } from "@/server/app/enum/profil.enum";

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
          className="flex items-center !text-sm !p-0 !text-primary"
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

// Version du menu mobile : sous-menu dépliable dans le flux plutôt qu'un menu
// flottant, qui recouvrirait les liens du menu plein écran.
export const UtilisateurMenuMobile = ({
  onNavigate,
}: {
  onNavigate: () => void;
}) => {
  const session = useSession();
  const { email, prenom, nom } = useProfilUtilisateurConnecte();
  const showPanelAdministrateur = peutAccederPanelAdministrateur(session);

  return (
    <Collapsible.Root className="w-full">
      <Collapsible.Trigger
        className="group flex items-center !text-sm !p-0 !text-primary"
        type="button"
      >
        <Icone icone={Account1Icon} />
        <span className="pl-2 pr-1">Mon espace</span>
        <Icone
          className="transition-transform duration-200 ease-in-out group-data-[state=open]:rotate-90"
          icone={ArrowSLine1Icon}
        />
      </Collapsible.Trigger>
      <Collapsible.Content className="flex flex-col gap-3 pt-3 pl-7">
        <div className="flex flex-col">
          <span className="font-bold text-base">
            {prenom} {nom}
          </span>
          <span className="text-sm">{email}</span>
        </div>
        <Link
          className="flex items-center gap-2 text-sm font-medium"
          href="/mon-profil-utilisateur"
          onClick={onNavigate}
        >
          <Icone className="text-current h-5 w-5" icone={Account1Icon} />
          Mon profil utilisateur
        </Link>
        {showPanelAdministrateur ? (
          <Link
            className="flex items-center gap-2 text-sm font-medium"
            href="/panel-administrateur/parametrage-metadata-indicateur"
            onClick={onNavigate}
          >
            <Icone className="text-current h-5 w-5" icone={Settings1Icon} />
            Panel administrateur
          </Link>
        ) : null}
        <BoutonSeDeconnecter />
      </Collapsible.Content>
    </Collapsible.Root>
  );
};
