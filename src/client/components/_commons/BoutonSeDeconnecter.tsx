import { signOut } from "next-auth/react";
import { Dropdown } from "@/components/shared/Dropdown";

export const BoutonSeDeconnecter = () => (
  <Dropdown.Button
    className="rounded min-w-[250px] !flex items-center gap-3 !py-2 !mx-0"
    onClick={() => signOut()}
    title="Déconnexion"
    type="button"
  >
    Déconnexion
  </Dropdown.Button>
);
