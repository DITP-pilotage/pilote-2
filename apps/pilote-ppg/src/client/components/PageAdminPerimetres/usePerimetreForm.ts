import { SubmitHandler, useForm } from "react-hook-form";
import { useRouter } from "next/router";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { perimetreCommandSchema } from "@/server/metadataPerimetre/handlers/EnregistrerPerimetreHandler";

export type PerimetreForm = z.infer<typeof perimetreCommandSchema>;

export const defaultPerimetreVide = (perimetreId: string): PerimetreForm => ({
  perimetreId,
  perimetreNom: "",
  perimetrePorteurId: null,
});

export const usePerimetreForm = ({
  defaultValues,
  estUneCréation,
}: {
  defaultValues: PerimetreForm;
  estUneCréation: boolean;
}) => {
  const router = useRouter();

  const reactHookForm = useForm<PerimetreForm>({
    resolver: zodResolver(perimetreCommandSchema),
    defaultValues,
  });

  const mutation = api.metadataPerimetre.enregistrer.useMutation({
    onSuccess: () => {
      toast.success(
        estUneCréation
          ? "Périmètre créé avec succès."
          : "Périmètre modifié avec succès.",
        { position: "bottom-right", richColors: true },
      );
      if (estUneCréation) {
        void router.push("/panel-administrateur/referentiels/perimetres");
      }
    },
    onError: (error) =>
      toast.error(error.message, {
        position: "bottom-right",
        richColors: true,
      }),
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
    isPending: mutation.isPending,
  };
};
