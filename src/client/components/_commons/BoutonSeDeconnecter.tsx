import { signOut } from "next-auth/react";
import { clsxm } from "@/utils/clsxm";
import { Icone } from "@/components/_commons/Icone";
import { ExternalLink1Icon } from "@/components/_commons/Icones/ExternalLink1Icon";

export const BoutonSeDeconnecter = () => (
  <button
    className={clsxm(
      "min-w-[250px] !py-1.5 !mx-0",
      "border border-gray-100",
      "!flex items-center justify-center gap-3",
      "!text-primary text-center font-semibold !text-sm",
    )}
    onClick={() => signOut()}
    title="Déconnexion"
    type="button"
  >
    <Icone className="h-4 w-4" icone={ExternalLink1Icon} />
    Se déconnecter
  </button>
);
