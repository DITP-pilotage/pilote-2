import { type ComponentProps, forwardRef } from "react";
import { Icone } from "@/components/_commons/Icone";
import { ClipboardIcon } from "@/components/_commons/Icones/ClipboardIcon";
import { clsxm } from "@/utils/clsxm";

// Présentation seule : l'appelant gère la copie et le retour utilisateur dans `onClick`.
export const BoutonCopier = forwardRef<
  HTMLButtonElement,
  {
    libelle: string;
    texte?: string;
  } & Omit<ComponentProps<"button">, "children" | "aria-label" | "title">
>(function BoutonCopier({ libelle, texte, className, ...props }, ref) {
  return (
    <button
      aria-label={libelle}
      className={clsxm(
        "inline-flex items-center gap-1 text-sm text-dsfr-blue-france-sun-113 focus-visible:outline-2 focus-visible:outline-dsfr-focus",
        className,
      )}
      ref={ref}
      title={libelle}
      type="button"
      {...props}
    >
      <Icone className="h-4 w-4 shrink-0" icone={ClipboardIcon} />
      {texte}
    </button>
  );
});
