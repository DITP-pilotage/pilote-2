import {
  calculerMediane,
  valeurMinimum,
  valeurMaximum,
} from "@/client/utils/statistiques/statistiques";
import type { Inject } from "@/server/chantiers/module";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import { ProfilCode } from "@/server/domain/utilisateur/Utilisateur.interface";

export class GetStatistiquesTauxAvancementIndicateurTerritoiresQuery {
  constructor(
    private readonly deps: Inject<"listerDetailsIndicateurTerritoireUseCaseV2">,
  ) {}

  async execute(params: {
    indicateurId: string;
    chantierId: string;
    maille: "regionale" | "departementale";
    jalon: number;
    habilitations: Habilitations;
    profil: ProfilCode;
  }) {
    const result =
      await this.deps.listerDetailsIndicateurTerritoireUseCaseV2.run(
        [params.indicateurId],
        params.chantierId,
        params.habilitations,
        params.profil,
        params.jalon,
      );

    const details = result[params.indicateurId] ?? {};
    const prefixeMaille = params.maille === "regionale" ? "REG-" : "DEPT-";

    const valeurs = Object.entries(details)
      .filter(
        ([territoireCode, detail]) =>
          territoireCode !== "NAT-FR" &&
          territoireCode.startsWith(prefixeMaille) &&
          detail.estApplicable !== false,
      )
      .map(([, detail]) => detail.avancement.annuel)
      .filter((valeur): valeur is number => valeur !== null);

    const minimum = valeurMinimum(valeurs);
    const médiane = calculerMediane(valeurs);
    const maximum = valeurMaximum(valeurs);

    return { minimum, médiane, maximum };
  }
}
