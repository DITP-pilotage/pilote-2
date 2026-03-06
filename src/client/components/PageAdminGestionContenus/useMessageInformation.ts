import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { validationContenu } from "@/validation/gestion-contenu";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { MessageInformationContrat } from "@/server/app/contrats/MessageInformationContrat";
import { Toaster } from "@/client/utils/toaster";

export type ContenuForm = {
  isBandeauActif: boolean;
  bandeauTexte: string;
  bandeauType: string;
};
export const useMessageInformation = ({
  messageInformation,
}: {
  messageInformation: MessageInformationContrat;
}) => {
  const utils = api.useUtils();

  const reactHookForm = useForm<ContenuForm>({
    resolver: zodResolver(validationContenu),
    defaultValues: {
      bandeauTexte:
        messageInformation.bandeauTexte ||
        "Des opérations de maintenance sont en cours et peuvent perturber le fonctionnement normal de PILOTE. En cas de difficultés : pilote.ditp@modernisation.gouv.fr",
      bandeauType: messageInformation.bandeauType || "WARNING",
      isBandeauActif: messageInformation.isBandeauActif || false,
    },
  });

  const mutationModifierBandeauIndisponibilite =
    api.gestionContenu.modifierBandeauIndisponibilite.useMutation({
      onSuccess: () => {
        Toaster.success("Modification réussie");
        utils.gestionContenu.recupererMessageInformation.invalidate();
      },
      onError: (error) => {
        if (error.data?.code === "INTERNAL_SERVER_ERROR") {
          Toaster.error(error.message);
        }
      },
    });

  const modifierIndicateur: SubmitHandler<ContenuForm> = async (data) => {
    const inputs = {
      csrf: récupérerUnCookie("csrf") ?? "",
      ...data,
    };

    mutationModifierBandeauIndisponibilite.mutate(inputs);
  };

  return { modifierIndicateur, reactHookForm };
};
