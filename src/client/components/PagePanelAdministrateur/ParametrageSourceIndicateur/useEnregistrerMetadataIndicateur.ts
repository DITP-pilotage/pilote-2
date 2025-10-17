import api from "@/server/infrastructure/api/trpc/api";
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";
import { FormValues } from "./form";

export function useEnregistrerMetadataIndicateur() {
  const enregistrerMetadataIndicateur =
    api.metadataIndicateur.enregistrerMetadataIndicateur.useMutation();
  const refreshRouter = useRefreshRouter();

  return (data: FormValues) => {
    enregistrerMetadataIndicateur.mutate(
      {
        metadataList: data.metadataList,
      },
      {
        onSuccess: refreshRouter,
      },
    );
  };
}
