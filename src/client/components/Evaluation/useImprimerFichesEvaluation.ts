import { toast } from "sonner";
import api from "@/server/infrastructure/api/trpc/api";

const openPDFInNewTab = (base64Data: string) => {
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
};

export function useImprimerFichesAppreciation() {
  return api.evaluation.genererPDFAppreciation.useMutation({
    onSuccess: (base64Data) => {
      openPDFInNewTab(base64Data);
      toast.success("PDF ouvert dans un nouvel onglet", {
        position: "top-right",
        richColors: true,
      });
    },
    onError: () => {
      toast.error("Erreur lors de la génération du PDF", {
        position: "top-right",
        richColors: true,
      });
    },
  });
}

export function useImprimerFichesInstruction() {
  return api.evaluation.genererPDFInstruction.useMutation({
    onSuccess: (base64Data) => {
      openPDFInNewTab(base64Data);
      toast.success("PDF ouvert dans un nouvel onglet", {
        position: "top-right",
        richColors: true,
      });
    },
    onError: () => {
      toast.error("Erreur lors de la génération du PDF", {
        position: "top-right",
        richColors: true,
      });
    },
  });
}
