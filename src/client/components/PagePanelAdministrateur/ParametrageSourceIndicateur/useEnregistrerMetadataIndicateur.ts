import { toast } from "sonner";
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
        onSuccess: () => {
          toast.success("Sauvegarde du metadata indicateur réussie", {
            position: "top-right",
            richColors: true,
          });
          refreshRouter();
        },
      },
    );
  };
}
