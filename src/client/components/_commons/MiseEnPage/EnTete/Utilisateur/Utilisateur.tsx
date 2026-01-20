import { useState } from "react";
import { Icone } from "@/components/_commons/Icone";
import { Account1Icon } from "@/components/_commons/Icones/Account1Icon";
import { ArrowSLine1Icon } from "@/components/_commons/Icones/ArrowSLine1Icon";
import { BoutonSeDeconnecter } from "@/components/_commons/BoutonSeDeconnecter";
import { BoutonPanelAdministrateur } from "@/components/_commons/BoutonPanelAdministrateur";
import { clsxm } from "@/utils/clsxm";
import { Dropdown } from "@/components/shared/Dropdown";
import api from "@/server/infrastructure/api/trpc/api";

export const Utilisateur = () => {
  const [estDeplie, setEstDeplie] = useState<boolean>(false);
  const [{ email, prenom, nom }] =
    api.profilUtilisateur.getUtilisateurConnecte.useSuspenseQuery();

  const { data: panelAdminEstDisponible } =
    api.gestionContenu.récupérerVariableContenu.useQuery({
      nomVariableContenu: "NEXT_PUBLIC_FF_PANEL_ADMIN",
    });

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

        <Dropdown.Item onSelect={() => router.push("/mon-profil-utilisateur")}>
          <Dropdown.Icone icone={Account1Icon} />
          Mon profil utilisateur
        </Dropdown.Item>
        {panelAdminEstDisponible ? <BoutonPanelAdministrateur /> : null}

        <Dropdown.Divider />

        <BoutonSeDeconnecter />
      </Dropdown.Content>
    </Dropdown.Root>
  );
};
