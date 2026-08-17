import { SubmitHandler, useForm } from "react-hook-form";
import { useState } from "react";
import { useRouter } from "next/router";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { perimetreCommandSchema } from "@/server/metadataPerimetre/handlers/EnregistrerPerimetreHandler";
import AlerteProps from "@/components/_commons/Alerte/Alerte.interface";

export type PerimetreForm = z.infer<typeof perimetreCommandSchema>;

export const defaultPerimetreVide = (perimetreId: string): PerimetreForm => ({
  perimetreId,
  perNom: "",
  perPorteurId: null,
});

export const usePerimetreForm = ({
  defaultValues,
  perimetreId,
  estUneCréation,
}: {
  defaultValues: PerimetreForm;
  perimetreId: string;
  estUneCréation: boolean;
}) => {
  const router = useRouter();
  const [alerte, setAlerte] = useState<AlerteProps | null>(null);

  const reactHookForm = useForm<PerimetreForm>({
    resolver: zodResolver(perimetreCommandSchema),
    defaultValues,
  });

  const mutation = api.metadataPerimetre.enregistrer.useMutation({
    onSuccess: () => {
      if (estUneCréation) {
        void router.push(
          "/panel-administrateur/referentiels/perimetres?_action=creation-reussie",
        );
      } else {
        void router.push(
          `/panel-administrateur/referentiels/perimetres/${perimetreId}?_action=modification-reussie`,
        );
      }
    },
    onError: (error) => setAlerte({ type: "erreur", titre: error.message }),
  });

  const enregistrer: SubmitHandler<PerimetreForm> = (data) => {
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
