import { SubmitHandler, useForm } from "react-hook-form";
import { useState } from "react";
import { useRouter } from "next/router";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { porteurCommandSchema } from "@/server/metadataPorteur/handlers/EnregistrerPorteurHandler";
import AlerteProps from "@/components/_commons/Alerte/Alerte.interface";

export type PorteurForm = z.infer<typeof porteurCommandSchema>;

export const defaultPorteurVide = (porteurId: string): PorteurForm => ({
  porteurId,
  porteurShort: "",
  porteurName: "",
  porteurDesc: null,
  porteurTypeShort: "MIN",
  porteurDirecteur: null,
  porteurNameShort: null,
  porteurPicto: null,
});

export const usePorteurForm = ({
  defaultValues,
  porteurId,
  estUneCréation,
}: {
  defaultValues: PorteurForm;
  porteurId: string;
  estUneCréation: boolean;
}) => {
  const router = useRouter();
  const [alerte, setAlerte] = useState<AlerteProps | null>(null);

  const reactHookForm = useForm<PorteurForm>({
    resolver: zodResolver(porteurCommandSchema),
    defaultValues,
  });

  const mutation = api.metadataPorteur.enregistrer.useMutation({
    onSuccess: () => {
      if (estUneCréation) {
        void router.push(
          "/panel-administrateur/referentiels/porteurs?_action=creation-reussie",
        );
      } else {
        void router.push(
          `/panel-administrateur/referentiels/porteurs/${porteurId}?_action=modification-reussie`,
        );
      }
    },
    onError: (error) => setAlerte({ type: "erreur", titre: error.message }),
  });

  const enregistrer: SubmitHandler<PorteurForm> = (data) => {
    mutation.mutate({
      csrf: récupérerUnCookie("csrf") ?? "",
      ...data,
      porteurDesc: data.porteurDesc || null,
      porteurDirecteur: data.porteurDirecteur || null,
      porteurNameShort: data.porteurNameShort || null,
      porteurPicto: data.porteurPicto || null,
    });
  };

  return {
    reactHookForm,
    enregistrer,
    alerte,
    isPending: mutation.isPending,
  };
};
