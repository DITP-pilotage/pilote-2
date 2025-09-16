import { signIn } from "next-auth/react";
import { Icone } from "@/components/_commons/Icone";
import { Account1Icon } from "@/components/_commons/Icones/Account1Icon";

export const BoutonSeConnecter = () => (
  <button
    className="flex gap-2 !p-0 !text-primary"
    onClick={() => signIn("keycloak")}
    title="Se connecter"
    type="button"
  >
    <Icone icone={Account1Icon} />
    Se connecter
  </button>
);
