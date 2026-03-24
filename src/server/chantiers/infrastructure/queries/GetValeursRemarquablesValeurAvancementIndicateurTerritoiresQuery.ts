import type { Inject } from "@/server/chantiers/module";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import { ProfilCode } from "@/server/domain/utilisateur/Utilisateur.interface";

export class GetValeursRemarquablesValeurAvancementIndicateurTerritoiresQuery {
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
      .map(([, detail]) => detail.valeurAvancement)
      .filter((valeur): valeur is number => valeur !== null);

    valeurs.sort((valueA, valueB) => valueA - valueB);

    const minimum = valeurs.length > 0 ? valeurs[0] : null;
    const maximum = valeurs.length > 0 ? valeurs[valeurs.length - 1] : null;
    let médiane: number | null = null;
    if (valeurs.length > 0) {
      const mid = Math.floor(valeurs.length / 2);
      médiane =
        valeurs.length % 2 === 0
          ? (valeurs[mid - 1] + valeurs[mid]) / 2
          : valeurs[mid];
    }

    return { minimum, médiane, maximum };
  }
}
