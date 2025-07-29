import { verifyValeurIsNotNullOrUndefined } from "@/server/utils/VerifyValeurIsNotNullOrUndefined";
import { configuration } from "@/config";
import { getAnneeDateDeBascule } from "@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/getAnneeDateDeBascule";

export const recupererJalon = (jalon: string | undefined) =>
  (jalon && !Number.isNaN(jalon) && verifyValeurIsNotNullOrUndefined(+jalon)) ||
  getAnneeDateDeBascule(
    new Date(),
    configuration.dateBasculeAffichageValeursAnneePrecedente,
  );
