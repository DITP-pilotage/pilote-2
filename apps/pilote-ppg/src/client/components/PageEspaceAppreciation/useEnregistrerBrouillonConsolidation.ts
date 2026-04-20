import { toast } from "sonner";
import { useCallback } from "react";
import api from "@/server/infrastructure/api/trpc/api";
import {
  enregistrerTousLesChamps,
  enregistrerUnChamp,
  FormCommentaireName,
  FormNoteName,
  FormValues,
} from "@/components/Evaluation/form";
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";
import { pageEspaceAppreciation } from "@/components/PageEspaceAppreciation/PageEspaceAppreciationServerSideContext";

export const useEnregistrerBrouillonConsolidation = () => {
  const refreshRouter = useRefreshRouter();
  const enregistrerBrouillon =
    api.evaluation.enregistrerBrouillonConsolidation.useMutation();
  // Attention : enregistrerBrouillon.mutateAsync est stable
  //  mais enregistrerBrouillon lui-même ne l'est pas
  const mutateAsync = enregistrerBrouillon.mutateAsync;
  const props = pageEspaceAppreciation.useServerSidePropsContext();

  return useCallback(
    (
      values: FormValues,
      showToast: boolean,
      fieldName?: FormCommentaireName | FormNoteName,
    ) => {
      const dataToSend = fieldName
        ? enregistrerUnChamp(values, fieldName)
        : enregistrerTousLesChamps(
            values,
            (ficheEvaluationId) =>
              props.rattachements.find(
                (rattachement) =>
                  rattachement.ficheEvaluationId === ficheEvaluationId,
              )?.readOnly ?? false,
          );

      if (!dataToSend) {
        return Promise.resolve();
      }

      return mutateAsync(dataToSend, {
        onSuccess: async () => {
          if (showToast) {
            toast.success("Données enregistrées", {
              position: "top-right",
              richColors: true,
            });
          }
          return refreshRouter();
        },
      });
    },
    [mutateAsync, props.rattachements, refreshRouter],
  );
};
