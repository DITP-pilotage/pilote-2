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
import { Toaster } from "@/client/utils/toaster";

export const useEnregistrerBrouillonInstruction = () => {
  const refreshRouter = useRefreshRouter();
  const enregistrerBrouillon =
    api.evaluation.enregistrerBrouillonInstruction.useMutation();
  const mutateAsync = enregistrerBrouillon.mutateAsync;

  return useCallback(
    (
      values: FormValues,
      showToast: boolean,
      fieldName?: FormCommentaireName | FormNoteName,
    ) => {
      const dataToSend = fieldName
        ? enregistrerUnChamp(values, fieldName)
        : enregistrerTousLesChamps(values, () => false);

      if (!dataToSend) {
        return Promise.resolve();
      }

      return mutateAsync(dataToSend, {
        onSuccess: () => {
          if (showToast) {
            Toaster.success("Données enregistrées");
          }
          return refreshRouter();
        },
      });
    },
    [mutateAsync, refreshRouter],
  );
};
