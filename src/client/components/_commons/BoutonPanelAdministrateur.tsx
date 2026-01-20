import Link from "next/link";
import { Dropdown } from "@/components/shared/Dropdown";
import { Settings1Icon } from "@/components/_commons/Icones/Settings1Icon";

export const BoutonPanelAdministrateur = () => {
  return (
    <Dropdown.Item asChild>
      <Link href="/panel-administrateur/parametrage-metadata-indicateur">
        <Dropdown.Icone icone={Settings1Icon} />
        Panel administrateur
      </Link>
    </Dropdown.Item>
  );
};
