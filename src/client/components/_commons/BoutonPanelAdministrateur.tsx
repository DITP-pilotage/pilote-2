import { Dropdown } from "@/components/shared/Dropdown";

export const BoutonPanelAdministrateur = () => (
  <Dropdown.Link
    className="rounded min-w-[250px] !flex items-center gap-3 !py-2 !mx-0"
    href="/panel-administrateur/parametrage-metadata-indicateur"
  >
    Panel administrateur
  </Dropdown.Link>
);
