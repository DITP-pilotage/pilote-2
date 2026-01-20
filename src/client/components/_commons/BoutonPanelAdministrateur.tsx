import { useRouter } from "next/router";
import { Dropdown } from "@/components/shared/Dropdown";
import { Settings1Icon } from "@/components/_commons/Icones/Settings1Icon";

export const BoutonPanelAdministrateur = () => {
  const router = useRouter();
  return (
    <Dropdown.Item
      onSelect={() =>
        router.push("/panel-administrateur/parametrage-metadata-indicateur")
      }
    >
      <Dropdown.Icone icone={Settings1Icon} />
      Panel administrateur
    </Dropdown.Item>
  );
};
