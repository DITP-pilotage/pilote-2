import { useState } from "react";
import { useSession } from "next-auth/react";
import Indicateur from "@/server/domain/indicateur/Indicateur.interface";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";

export const useModaleSuppressionValeurAvancementV2 = ({
  indicateur,
  territoireCode,
  dateValeurAvancement,
}: {
  indicateur: Indicateur;
  territoireCode: string;
  dateValeurAvancement: string;
}) => {
  const { data: session } = useSession();

  const auteurModification = session?.user.name!;

  const [estSupprime, setEstSupprime] = useState<boolean>(false);

  const mutationSupprimerPropositionValeurAvancement =
    api.propositionValeurAvancement.supprimerV2.useMutation({
      onSuccess: () => {
        setEstSupprime(true);
      },
    });

  const supprimerPropositionValeurAvancement = async () => {
    const inputs = {
      csrf: récupérerUnCookie("csrf") ?? "",
      indicId: indicateur.id,
      auteurModification,
      territoireCode,
      dateValeurAvancement: dateValeurAvancement,
    };

    mutationSupprimerPropositionValeurAvancement.mutate(inputs);
  };

  return {
    supprimerPropositionValeurAvancement,
    estSupprime,
  };
};
