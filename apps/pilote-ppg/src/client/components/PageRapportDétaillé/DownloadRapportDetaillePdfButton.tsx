import { useRouter } from "next/router";
import { useState } from "react";
import { toast } from "sonner";
import { Icone } from "@/components/_commons/Icone";
import { DownloadIcon } from "@/components/_commons/Icones/DownloadIcon";

function filenameFrom(response: Response): string {
  const disposition = response.headers.get("Content-Disposition") ?? "";
  return /filename="([^"]+)"/.exec(disposition)?.[1] ?? "rapport-detaille.pdf";
}

export const DownloadRapportDetaillePdfButton = ({
  showDetail,
}: {
  showDetail: boolean;
}) => {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);

  const download = async () => {
    setIsGenerating(true);
    try {
      const params = new URLSearchParams();
      Object.entries(router.query).forEach(([name, value]) => {
        (Array.isArray(value) ? value : [value]).forEach((item) => {
          if (item !== undefined) params.append(name, item);
        });
      });
      params.set("detail", String(showDetail));
      const response = await fetch(`/api/rapport-detaille/pdf?${params}`);
      if (!response.ok) throw new Error(String(response.status));
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = filenameFrom(response);
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Erreur lors de la génération du PDF", {
        position: "top-right",
        richColors: true,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      aria-busy={isGenerating}
      className="fr-btn gap-2 fr-btn--tertiary-no-outline fr-text--sm"
      disabled={isGenerating}
      onClick={download}
      type="button"
    >
      <Icone className="w-4 h-4" icone={DownloadIcon} />
      {isGenerating ? "Génération du PDF…" : "Télécharger le PDF"}
    </button>
  );
};
