import { useState } from "react";
import { useSession } from "next-auth/react";
import Indicateur from "@/server/domain/indicateur/Indicateur.interface";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";

export const useModaleSuppressionValeurAvancement = ({
  indicateur,
  territoireCode,
}: {
  indicateur: Indicateur;
  territoireCode: string;
}) => {
  const { data: session } = useSession();

  const auteurModification = session?.user.name!;

  const [estSupprime, setEstSupprime] = useState<boolean>(false);

  const mutationSupprimerPropositionValeurAvancement =
    api.propositionValeurAvancement.supprimer.useMutation({
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
    };

    mutationSupprimerPropositionValeurAvancement.mutate(inputs);
  };

  return {
    supprimerPropositionValeurAvancement,
    estSupprime,
  };
};
