import { SubmitHandler, useForm } from "react-hook-form";
import { useRouter } from "next/router";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { zonegroupCommandSchema } from "@/server/metadataZonegroup/handlers/EnregistrerZonegroupHandler";

export type ZonegroupForm = z.infer<typeof zonegroupCommandSchema>;

export const defaultZonegroupVide = (zoneGroupId: string): ZonegroupForm => ({
  zoneGroupId,
  zoneGroupName: "",
  zoneGroupDesc: null,
  zoneGroupZones: [],
});

export const useZonegroupForm = ({
  defaultValues,
  estUneCréation,
}: {
  defaultValues: ZonegroupForm;
  estUneCréation: boolean;
}) => {
  const router = useRouter();

  const reactHookForm = useForm<ZonegroupForm>({
    resolver: zodResolver(zonegroupCommandSchema),
    defaultValues,
  });

  const mutation = api.metadataZonegroup.enregistrer.useMutation({
    onSuccess: () => {
      toast.success(
        estUneCréation
          ? "Zone groupe créée avec succès."
          : "Zone groupe modifiée avec succès.",
        { position: "bottom-right", richColors: true },
      );
      if (estUneCréation) {
        void router.push("/panel-administrateur/referentiels/zonegroups");
      }
    },
    onError: (error) =>
      toast.error(error.message, {
        position: "bottom-right",
        richColors: true,
      }),
  });

  const enregistrer: SubmitHandler<ZonegroupForm> = (data) => {
    mutation.mutate({
      csrf: récupérerUnCookie("csrf") ?? "",
      ...data,
      zoneGroupDesc: data.zoneGroupDesc || null,
    });
  };

  return {
    reactHookForm,
    enregistrer,
    isPending: mutation.isPending,
  };
};
