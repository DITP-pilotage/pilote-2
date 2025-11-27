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
        : enregistrerTousLesChamps(values);

      if (!dataToSend) {
        return Promise.resolve();
      }

      return mutateAsync(dataToSend, {
        onSuccess: () => {
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
    [mutateAsync, refreshRouter],
  );
};
