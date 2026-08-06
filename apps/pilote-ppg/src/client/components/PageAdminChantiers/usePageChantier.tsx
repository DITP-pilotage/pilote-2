import { SubmitHandler, useForm } from "react-hook-form";
import { useState } from "react";
import { useRouter } from "next/router";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { MetadataChantierContrat } from "@/server/app/contrats/MetadataChantierContrat";
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

export const usePageChantier = (chantier: MetadataChantierContrat) => {
  const router = useRouter();
  const [alerte, setAlerte] = useState<AlerteProps | null>(null);
  const [estEnCoursDeModification, setEstEnCoursDeModification] =
    useState<boolean>(false);

  const reactHookForm = useForm<ChantierForm>({
    resolver: zodResolver(validationChantierSchema),
    defaultValues: {
      ...chantier,
      chSaisieAte: chantier.chSaisieAte ?? null,
      conseillerMail: chantier.conseillerMail ?? "",
    },
  });

  const mutationModifier = api.metadataChantier.modifier.useMutation({
    onSuccess: () => {
      setEstEnCoursDeModification(false);
      router.push(
        `/panel-administrateur/chantiers/${chantier.chantierId}?_action=modification-reussie`,
      );
    },
    onError: (error) => {
      setAlerte({ type: "erreur", titre: error.message });
    },
  });

  const mutationCreer = api.metadataChantier.creer.useMutation({
    onSuccess: () => {
      setEstEnCoursDeModification(false);
      router.push(
        `/panel-administrateur/chantiers/${chantier.chantierId}?_action=creation-reussie`,
      );
    },
    onError: (error) => {
      setAlerte({ type: "erreur", titre: error.message });
    },
  });

  const buildMutateInput = (data: ChantierForm) => ({
    csrf: récupérerUnCookie("csrf") ?? "",
    ...data,
    conseillerMail: data.conseillerMail || null,
  });

  const modifierChantier: SubmitHandler<ChantierForm> = (data) => {
    mutationModifier.mutate(buildMutateInput(data));
  };

  const creerChantier: SubmitHandler<ChantierForm> = (data) => {
    mutationCreer.mutate(buildMutateInput(data));
  };

  const reinitialiser = () => {
    reactHookForm.reset();
    setEstEnCoursDeModification(false);
  };

  return {
    estEnCoursDeModification,
    setEstEnCoursDeModification,
    modifierChantier,
    creerChantier,
    reactHookForm,
    alerte,
    reinitialiser,
  };
};
