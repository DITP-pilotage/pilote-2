import { toast } from "sonner";
import { Icone } from "@/components/_commons/Icone";
import { ClipboardIcon } from "@/components/_commons/Icones/ClipboardIcon";

export function BoutonCopierEmail({
  email,
  nomComplet,
}: {
  email: string;
  nomComplet: string;
}) {
  const libelle = `Copier l'adresse e-mail de ${nomComplet}`;

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(email);
      toast.success("Adresse e-mail copiée");
    } catch {
      toast.error("L'adresse e-mail n'a pas pu être copiée");
    }
  };

  return (
    <button
      aria-label={libelle}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded hover:bg-dsfr-blue-france-950 focus-visible:outline-2 focus-visible:outline-dsfr-focus"
      onClick={() => void copier()}
      title={libelle}
      type="button"
    >
      <Icone className="h-4 w-4" icone={ClipboardIcon} />
    </button>
  );
}
