import { toast } from "sonner";
import api from "@/server/infrastructure/api/trpc/api";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";

export const BoutonValiderSaisieCriteres = ({
  ficheEvaluationId,
}: {
  ficheEvaluationId: string;
}) => {
  const validerSaisie = api.evaluation.validerSaisieCriteres.useMutation();
  const refreshRouter = useRefreshRouter();

  const handleClick = async () => {
    await validerSaisie.mutateAsync(
      { ficheEvaluationId },
      {
        onSuccess: async () => {
          toast.success("Manières de servir validées", {
            position: "top-right",
            richColors: true,
          });
          await refreshRouter();
        },
        onError: () => {
          toast.error("Erreur lors de la validation", {
            position: "top-right",
            richColors: true,
          });
        },
      },
    );
  };

  return (
    <Bouton
      label="Valider"
      onClick={handleClick}
      type="button"
      variant="primary"
      disabled={validerSaisie.isLoading}
    />
  );
};
