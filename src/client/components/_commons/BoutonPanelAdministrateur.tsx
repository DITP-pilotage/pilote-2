import { useRouter } from "next/router";
import { Dropdown } from "@/components/shared/Dropdown";
import { Icone } from "@/components/_commons/Icone";
import { Settings1Icon } from "@/components/_commons/Icones/Settings1Icon";

export const BoutonPanelAdministrateur = () => {
  const router = useRouter();
  return (
    <Dropdown.Item
      onSelect={() =>
        router.push("/panel-administrateur/parametrage-metadata-indicateur")
      }
    >
      <Icone className="text-current h-5 w-5" icone={Settings1Icon} />
      Panel administrateur
    </Dropdown.Item>
  );
};
