import { signOut } from "next-auth/react";

export const BoutonSeDeconnecter = () => (
  <button
    className="!p-0"
    onClick={() => signOut()}
    title="Déconnexion"
    type="button"
  >
    Déconnexion
  </button>
);
