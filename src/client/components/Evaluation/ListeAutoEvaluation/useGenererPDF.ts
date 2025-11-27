import { toast } from "sonner";
import api from "@/server/infrastructure/api/trpc/api";
import { FicheEvaluation } from "@/components/Evaluation/ListeAutoEvaluation/ListeAutoEvaluations";

const downloadPDF = (base64Data: string, filename: string) => {
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    // eslint-disable-next-line unicorn/prefer-code-point
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export function useGenererPDF(fichesEvaluation: FicheEvaluation[]) {
  return api.evaluation.genererPDFAutoEvaluation.useMutation({
    onSuccess: (base64Data, variables) => {
      const fiche = fichesEvaluation.find(
        (f) => f.id === variables.ficheEvaluationId,
      );
      const filename = fiche
        ? `auto-evaluation-${fiche.rattachement.code}.pdf`
        : "auto-evaluation.pdf";
      downloadPDF(base64Data, filename);
      toast.success("PDF généré avec succès", {
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
