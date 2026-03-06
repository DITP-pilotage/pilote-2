import { useRouter } from "next/router";
import api from "@/server/infrastructure/api/trpc/api";
import { wording } from "@/client/utils/i18n/i18n";
import { Toaster } from "@/client/utils/toaster";

export const usePublierIndicateur = (
  chantierId: string,
  indicateurId: string,
  rapportId: string,
) => {
  const router = useRouter();

  const mutation = api.indicateur.publierFichierImporte.useMutation({
    onSuccess: () => {
      Toaster.success(
        wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT.ETAPE_PUBLIER_FICHIER.TITRE_ALERT_SUCCES(
          indicateurId,
        ),
      );
      router.push(`/chantier/${chantierId}/indicateurs`);
    },
    onError: () => {
      Toaster.error(
        wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT
          .ETAPE_PUBLIER_FICHIER.TITRE_ALERT_ERREUR,
      );
    },
  });

  const publierLeFichier = () => {
    mutation.mutate({ rapportId });
  };

  return { publierLeFichier, estEnChargement: mutation.isPending };
};
