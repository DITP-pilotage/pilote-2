import { useState } from "react";
import { toast } from "sonner";
import { Icone } from "@/components/_commons/Icone";
import { ClipboardIcon } from "@/components/_commons/Icones/ClipboardIcon";
import { FileTextIcon } from "@/components/_commons/Icones/FileTextIcon";
import { LoaderIcon } from "@/components/_commons/Icones/LoaderIcon";
import { markdownVersHtmlPressePapiers } from "@/components/_commons/ChatUI/markdownVersHtmlPressePapiers";

const boutonClassName =
  "p-1 rounded bg-white/80 text-gray-500 hover:text-gray-800 hover:bg-gray-100 border border-gray-200 disabled:opacity-50";

export const LastResponseActions = ({
  texte,
  conversationId,
  messageId,
}: {
  texte: string;
  conversationId: string;
  messageId: string;
}) => {
  const [exportEnCours, setExportEnCours] = useState(false);

  const copier = async () => {
    try {
      const html = markdownVersHtmlPressePapiers(texte);
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([texte], { type: "text/plain" }),
        }),
      ]);
      toast.success("Texte copié dans le presse-papiers", { duration: 3000 });
    } catch {
      toast.error("La copie a échoué, réessayez.");
    }
  };

  const exporterPdf = async () => {
    setExportEnCours(true);
    try {
      const reponse = await fetch(
        `/api/albert/conversations/${conversationId}/messages/${messageId}/export-pdf`,
        { method: "POST" },
      );
      if (!reponse.ok) throw new Error("export failed");

      const blob = await reponse.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("L'export a échoué, réessayez.");
    } finally {
      setExportEnCours(false);
    }
  };

  return (
    <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover/message:opacity-100 transition-opacity">
      <button
        className={boutonClassName}
        onClick={copier}
        title="Copier dans le presse-papiers"
        type="button"
      >
        <Icone className="w-4 h-4" icone={ClipboardIcon} />
      </button>
      <button
        className={boutonClassName}
        onClick={exporterPdf}
        disabled={exportEnCours}
        title="Exporter en PDF"
        type="button"
      >
        {exportEnCours ? (
          <LoaderIcon className="w-4 h-4 animate-spin" />
        ) : (
          <Icone className="w-4 h-4" icone={FileTextIcon} />
        )}
      </button>
    </div>
  );
};
