import Link from "next/link";
import { Icone } from "@/components/_commons/Icone";
import { Account1Icon } from "@/components/_commons/Icones/Account1Icon";

export const BoutonSeConnecter = () => (
  <Link
    className="flex gap-2 !p-0 !text-primary"
    href="/connexion"
    title="Se connecter"
  >
    <Icone icone={Account1Icon} />
    Se connecter
  </Link>
);
