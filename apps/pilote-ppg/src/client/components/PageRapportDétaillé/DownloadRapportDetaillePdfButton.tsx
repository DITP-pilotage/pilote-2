import { useRouter } from "next/router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/shared/Button";
import { downloadBlob } from "@/client/utils/downloadBlob";
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
      if (response.status === 503) {
        toast.info(
          "Trop de PDF sont en cours de génération, réessayez dans quelques secondes.",
          { position: "top-right", richColors: true },
        );
        return;
      }
      if (
        response.status === 401 ||
        response.redirected ||
        (response.ok &&
          !response.headers.get("Content-Type")?.startsWith("application/pdf"))
      ) {
        toast.error(
          "Votre session a expiré, rechargez la page pour vous reconnecter.",
          { position: "top-right", richColors: true },
        );
        return;
      }
      if (!response.ok) throw new Error(String(response.status));
      downloadBlob(await response.blob(), filenameFrom(response));
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
    <Button
      aria-busy={isGenerating}
      className="gap-2 text-sm"
      disabled={isGenerating}
      onClick={download}
      type="button"
      variant="tertiary-no-outline"
    >
      <Icone className="w-4 h-4" icone={DownloadIcon} />
      {isGenerating ? "Génération du PDF…" : "Télécharger le PDF"}
    </Button>
  );
};
