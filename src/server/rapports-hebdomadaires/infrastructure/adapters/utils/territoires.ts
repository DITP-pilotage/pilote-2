import { TerritoireDTO } from "@/server/gestion-utilisateur/infrastructure/queries/PrismaUtilisateursQuery";
import { TerritoireCoordinateur } from "@/server/rapports-hebdomadaires/domain/Coordinateur";

export const filtrerTerritoireNat = (
  territoire: TerritoireDTO,
): territoire is TerritoireCoordinateur => territoire.maille !== "NAT";
