import { signOut } from "next-auth/react";
import { Dropdown } from "@/components/shared/Dropdown";

export const BoutonSeDeconnecter = () => (
  <Dropdown.Button onClick={() => signOut()} title="Déconnexion" type="button">
    Déconnexion
  </Dropdown.Button>
);
