import { SubmitHandler, useForm } from "react-hook-form";
import { useState } from "react";
import { useRouter } from "next/router";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { engagementCommandSchema } from "@/server/metadataEngagement/handlers/EnregistrerEngagementHandler";
import AlerteProps from "@/components/_commons/Alerte/Alerte.interface";

export type EngagementForm = z.infer<typeof engagementCommandSchema>;

export const defaultEngagementVide = (
  engagementId: string,
): EngagementForm => ({
  engagementId,
  engagementShort: "",
  engagementName: "",
  estUneCréation: true,
});

export const useEngagementForm = ({
  defaultValues,
  engagementId,
  estUneCréation,
}: {
  defaultValues: EngagementForm;
  engagementId: string;
  estUneCréation: boolean;
}) => {
  const router = useRouter();
  const [alerte, setAlerte] = useState<AlerteProps | null>(null);

  const reactHookForm = useForm<EngagementForm>({
    resolver: zodResolver(engagementCommandSchema),
    defaultValues,
  });

  const mutation = api.metadataEngagement.enregistrer.useMutation({
    onSuccess: () => {
      if (estUneCréation) {
        void router.push(
          "/panel-administrateur/referentiels-deprecies/engagements?_action=creation-reussie",
        );
      } else {
        void router.push(
          `/panel-administrateur/referentiels-deprecies/engagements/${engagementId}?_action=modification-reussie`,
        );
      }
    },
    onError: (error) => setAlerte({ type: "erreur", titre: error.message }),
  });

  const enregistrer: SubmitHandler<EngagementForm> = (data) => {
    mutation.mutate({
      csrf: récupérerUnCookie("csrf") ?? "",
      ...data,
    });
  };

  return {
    reactHookForm,
    enregistrer,
    alerte,
    isPending: mutation.isPending,
  };
};
