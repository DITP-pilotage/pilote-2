import { SubmitHandler, useForm } from "react-hook-form";
import { useState } from "react";
import { useRouter } from "next/router";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { zonegroupCommandSchema } from "@/server/metadataZonegroup/handlers/EnregistrerZonegroupHandler";
import AlerteProps from "@/components/_commons/Alerte/Alerte.interface";

export type ZonegroupForm = z.infer<typeof zonegroupCommandSchema>;

export const defaultZonegroupVide = (zoneGroupId: string): ZonegroupForm => ({
  zoneGroupId,
  zgName: "",
  zgDesc: null,
  zgZones: [],
});

export const useZonegroupForm = ({
  defaultValues,
  zoneGroupId,
  estUneCréation,
}: {
  defaultValues: ZonegroupForm;
  zoneGroupId: string;
  estUneCréation: boolean;
}) => {
  const router = useRouter();
  const [alerte, setAlerte] = useState<AlerteProps | null>(null);

  const reactHookForm = useForm<ZonegroupForm>({
    resolver: zodResolver(zonegroupCommandSchema),
    defaultValues,
  });

  const mutation = api.metadataZonegroup.enregistrer.useMutation({
    onSuccess: () => {
      if (estUneCréation) {
        void router.push(
          "/panel-administrateur/referentiels/zonegroups?_action=creation-reussie",
        );
      } else {
        void router.push(
          `/panel-administrateur/referentiels/zonegroups/${zoneGroupId}?_action=modification-reussie`,
        );
      }
    },
    onError: (error) => setAlerte({ type: "erreur", titre: error.message }),
  });

  const enregistrer: SubmitHandler<ZonegroupForm> = (data) => {
    mutation.mutate({
      csrf: récupérerUnCookie("csrf") ?? "",
      ...data,
      zgDesc: data.zgDesc || null,
    });
  };

  return {
    reactHookForm,
    enregistrer,
    alerte,
    isPending: mutation.isPending,
  };
};
