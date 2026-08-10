import { SubmitHandler, useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { $Enums } from "@prisma/client";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import AlerteProps from "@/components/_commons/Alerte/Alerte.interface";

const MAILLES = ["NAT", "REG", "DEPT"] as const;

export const validationChantierSchema = z.object({
  chantierId: z.string().regex(/^CH-\d{3}$/),
  chNom: z.string().min(1, "Le nom est obligatoire").max(500),
  chDescr: z.string().nullable(),
  chPpg: z.string().min(1, "Le PPG est obligatoire"),
  chTerrito: z.boolean(),
  chHiddenPilote: z.boolean(),
  chSaisieAte: z
    .enum(["ate", "hors_ate_deconcentre", "hors_ate_centralise"])
    .nullable(),
  chState: z.enum(["BROUILLON", "PUBLIE", "ARCHIVE", "SUPPRIME"]),
  zgApplicable: z.string().nullable(),
  porteurIdsNoDAC: z.array(z.string()),
  porteurIdsDAC: z.array(z.string()),
  chPer: z.string().min(1, "Le périmètre est obligatoire"),
  mailleApplicable: z
    .array(z.enum(MAILLES))
    .min(1, "Au moins une maille est requise"),
  chCibleAttendue: z.boolean(),
  conseillerMail: z.string().nullable(),
});

export type ChantierForm = z.infer<typeof validationChantierSchema>;

const defaultChantierVide = (chantierId: string): ChantierForm => ({
  chantierId,
  chNom: "",
  chDescr: null,
  chPpg: "",
  chTerrito: false,
  chHiddenPilote: false,
  chSaisieAte: null,
  chState: $Enums.type_statut.BROUILLON,
  zgApplicable: null,
  porteurIdsNoDAC: [],
  porteurIdsDAC: [],
  chPer: "",
  mailleApplicable: ["NAT", "REG", "DEPT"],
  chCibleAttendue: false,
  conseillerMail: null,
});

export const usePageChantier = ({
  chantierId,
  estUneCréation,
}: {
  chantierId: string;
  estUneCréation: boolean;
}) => {
  const router = useRouter();
  const [alerte, setAlerte] = useState<AlerteProps | null>(null);

  const { data: options, isLoading: isLoadingOptions } =
    api.metadataChantier.récupérerOptions.useQuery();

  const { data: chantierData, isLoading: isLoadingChantier } =
    api.metadataChantier.récupérer.useQuery(
      { chantierId },
      { enabled: !estUneCréation },
    );

  const { data: idSuivant, isLoading: isLoadingIdSuivant } =
    api.metadataChantier.récupérerIdSuivant.useQuery(undefined, {
      enabled: estUneCréation,
    });

  const isLoading = estUneCréation
    ? isLoadingOptions || isLoadingIdSuivant
    : isLoadingOptions || isLoadingChantier;

  const reactHookForm = useForm<ChantierForm>({
    resolver: zodResolver(validationChantierSchema),
    defaultValues: defaultChantierVide(chantierId),
  });

  useEffect(() => {
    if (estUneCréation && idSuivant) {
      reactHookForm.reset(defaultChantierVide(idSuivant));
    }
  }, [estUneCréation, idSuivant, reactHookForm]);

  useEffect(() => {
    if (!estUneCréation && chantierData) {
      reactHookForm.reset({
        ...chantierData,
        chSaisieAte: chantierData.chSaisieAte ?? null,
        conseillerMail: chantierData.conseillerMail ?? "",
      });
    }
  }, [estUneCréation, chantierData, reactHookForm]);

  const mutationModifier = api.metadataChantier.modifier.useMutation({
    onSuccess: () => {
      router.push(
        `/panel-administrateur/chantiers/${chantierId}?_action=modification-reussie`,
      );
    },
    onError: (error) => {
      setAlerte({ type: "erreur", titre: error.message });
    },
  });

  const mutationCreer = api.metadataChantier.creer.useMutation({
    onSuccess: () => {
      router.push(
        `/panel-administrateur/chantiers/${chantierId}?_action=creation-reussie`,
      );
    },
    onError: (error) => {
      setAlerte({ type: "erreur", titre: error.message });
    },
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

  return {
    modifierChantier,
    creerChantier,
    reactHookForm,
    alerte,
    options,
    isLoading,
    chantierId: estUneCréation ? (idSuivant ?? chantierId) : chantierId,
  };
};
