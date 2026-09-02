import { SubmitHandler, useForm } from "react-hook-form";
import { useRouter } from "next/router";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { $Enums } from "@prisma/client";
import { toast } from "sonner";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { MAILLES } from "@/server/metadataChantier/domain/maille";

export const validationChantierSchema = z.object({
  chantierId: z.string().regex(/^CH-\d{3}$/),
  chNom: z.string().min(1, "Le nom est obligatoire").max(500),
  chDescr: z.string().nullable(),
  chPpg: z.string().min(1, "Le PPG est obligatoire"),
  chTerrito: z.boolean(),
  chSaisieAte: z
    .enum(["ate", "hors_ate_deconcentre", "hors_ate_centralise"])
    .nullable(),
  chState: z.enum(["BROUILLON", "PUBLIE", "ARCHIVE", "SUPPRIME"]),
  zgApplicable: z.string().nullable(),
  porteurIdPrincipal: z.string().min(1, "Le porteur principal est obligatoire"),
  porteurIdsSecondaires: z.array(z.string()),
  porteurIdsDAC: z.array(z.string()),
  chPer: z.string().min(1, "Le périmètre est obligatoire"),
  mailleApplicable: z
    .array(z.enum(MAILLES))
    .min(1, "Au moins une maille est requise"),
  chCibleAttendue: z.boolean(),
  conseillerMail: z.string().nullable(),
});

export type ChantierForm = z.infer<typeof validationChantierSchema>;

export const defaultChantierVide = (chantierId: string): ChantierForm => ({
  chantierId,
  chNom: "",
  chDescr: null,
  chPpg: "",
  chTerrito: false,
  chSaisieAte: null,
  chState: $Enums.type_statut.BROUILLON,
  zgApplicable: null,
  porteurIdPrincipal: "",
  porteurIdsSecondaires: [],
  porteurIdsDAC: [],
  chPer: "",
  mailleApplicable: ["NAT"],
  chCibleAttendue: false,
  conseillerMail: null,
});

export const useChantierForm = ({
  defaultValues,
}: {
  defaultValues: ChantierForm;
}) => {
  const router = useRouter();

  const reactHookForm = useForm<ChantierForm>({
    resolver: zodResolver(validationChantierSchema),
    defaultValues,
  });

  const mutationModifier = api.metadataChantier.enregistrer.useMutation({
    onSuccess: () => {
      toast.success("Chantier modifié avec succès.", {
        position: "bottom-right",
        richColors: true,
      });
    },
    onError: (error) =>
      toast.error(error.message, {
        position: "bottom-right",
        richColors: true,
      }),
  });

  const mutationCreer = api.metadataChantier.enregistrer.useMutation({
    onSuccess: () => {
      toast.success("Chantier créé avec succès.", {
        position: "bottom-right",
        richColors: true,
      });
      void router.push("/panel-administrateur/chantiers");
    },
    onError: (error) =>
      toast.error(error.message, {
        position: "bottom-right",
        richColors: true,
      }),
  });

  const modifierChantier: SubmitHandler<ChantierForm> = (data) => {
    mutationModifier.mutate({
      csrf: récupérerUnCookie("csrf") ?? "",
      ...data,
      conseillerMail: data.conseillerMail || null,
    });
  };

  const creerChantier: SubmitHandler<ChantierForm> = (data) => {
    mutationCreer.mutate({
      csrf: récupérerUnCookie("csrf") ?? "",
      ...data,
      conseillerMail: data.conseillerMail || null,
    });
  };

  return { reactHookForm, modifierChantier, creerChantier };
};
