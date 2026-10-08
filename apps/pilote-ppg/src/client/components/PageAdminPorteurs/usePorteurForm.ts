import { SubmitHandler, useForm } from "react-hook-form";
import { useRouter } from "next/router";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { api } from "@/server/framework/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { porteurCommandSchema } from "@/server/referentiels/porteur/handlers/SavePorteurHandler";

export type PorteurForm = z.infer<typeof porteurCommandSchema>;

export const defaultPorteurVide = (porteurId: string): PorteurForm => ({
  porteurId,
  porteurShort: "",
  porteurName: "",
  porteurDesc: null,
  porteurType: "MIN",
  porteurDirecteur: null,
  porteurPicto: null,
});

export const usePorteurForm = ({
  defaultValues,
  isCreation,
}: {
  defaultValues: PorteurForm;
  isCreation: boolean;
}) => {
  const router = useRouter();

  const reactHookForm = useForm<PorteurForm>({
    resolver: zodResolver(porteurCommandSchema),
    defaultValues,
  });

  const mutation = api.referentielPorteur.save.useMutation({
    onSuccess: () => {
      toast.success(
        isCreation
          ? "Porteur créé avec succès."
          : "Porteur modifié avec succès.",
        { position: "bottom-right", richColors: true },
      );
      if (isCreation) {
        void router.push("/panel-administrateur/referentiels/porteurs");
      }
    },
    onError: (error) =>
      toast.error(error.message, {
        position: "bottom-right",
        richColors: true,
      }),
  });

  const enregistrer: SubmitHandler<PorteurForm> = (data) => {
    mutation.mutate({
      csrf: récupérerUnCookie("csrf") ?? "",
      ...data,
      porteurDesc: data.porteurDesc || null,
      porteurDirecteur: data.porteurDirecteur || null,
      porteurPicto: data.porteurPicto || null,
    });
  };

  return {
    reactHookForm,
    enregistrer,
    isPending: mutation.isPending,
  };
};
