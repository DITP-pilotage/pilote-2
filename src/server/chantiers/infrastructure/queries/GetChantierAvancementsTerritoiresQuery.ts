import { Inject } from "@/server/chantiers/module";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import { ProfilCode } from "@/server/domain/utilisateur/Utilisateur.interface";

export type AvancementTerritoireViewModel = {
  territoireCode: string;
  territoireNom: string;
  codeInsee: string;
  maille: string;
  avancementAnnuel: number | null;
  estApplicable: boolean | null;
  dateTauxAvancementAnnuel: string | null;
};

type TerritoireDonnees = {
  territoireCode: string;
  codeInsee: string;
  avancementAnnuel: number | null;
  estApplicable: boolean | null;
  dateTauxAvancementAnnuel: string | null;
};

function agrégerTerritoiresDonnees(
  donnéesParChantier: TerritoireDonnees[][],
): Map<string, TerritoireDonnees> {
  const grouped = new Map<string, TerritoireDonnees[]>();
  for (const chantierDonnees of donnéesParChantier) {
    for (const donnees of chantierDonnees) {
      const existing = grouped.get(donnees.territoireCode) ?? [];
      grouped.set(donnees.territoireCode, [...existing, donnees]);
    }
  }

  const result = new Map<string, TerritoireDonnees>();
  for (const [territoireCode, donnees] of grouped) {
    const valeurs = donnees
      .map((d) => d.avancementAnnuel)
      .filter((v): v is number => v !== null);
    const avancementAnnuel =
      valeurs.length > 0
        ? valeurs.reduce((sum, v) => sum + v, 0) / valeurs.length
        : null;

    const estApplicableValues = donnees
      .map((d) => d.estApplicable)
      .filter((v): v is boolean => v !== null);
    let estApplicable: boolean | null = null;
    if (estApplicableValues.length > 0) {
      estApplicable = estApplicableValues.some((v) => !v) ? false : true;
    }

    const dates = donnees
      .map((d) => d.dateTauxAvancementAnnuel)
      .filter((d): d is string => d !== null);
    const dateTauxAvancementAnnuel =
      dates.length > 0 ? (dates.sort().at(-1) ?? null) : null;

    result.set(territoireCode, {
      territoireCode,
      codeInsee: donnees[0].codeInsee,
      avancementAnnuel,
      estApplicable,
      dateTauxAvancementAnnuel,
    });
  }
  return result;
}

export class GetChantierAvancementsTerritoiresQuery {
  constructor(
    private readonly deps: Inject<
      "recupererChantierUseCaseV2" | "territoireRepository"
    >,
  ) {}

  async execute(params: {
    chantierIds: string[];
    jalon: number;
    habilitations: Habilitations;
    profil: ProfilCode;
  }): Promise<AvancementTerritoireViewModel[]> {
    const chantiers = await Promise.all(
      params.chantierIds.map((chantierId) =>
        this.deps.recupererChantierUseCaseV2.run(
          chantierId,
          params.habilitations,
          params.profil,
          params.jalon,
        ),
      ),
    );

    const territoires = await this.deps.territoireRepository.récupérerTousNew();
    const territoiresMap = new Map(
      territoires.map((territoire) => [territoire.code, territoire]),
    );

    const natDonnéesParChantier = chantiers.map((chantier) =>
      Object.entries(chantier.mailles.nationale).map(
        ([codeInsee, donnees]) => ({
          territoireCode: donnees.territoireCode,
          codeInsee,
          avancementAnnuel: donnees.avancement.annuel,
          estApplicable: donnees.estApplicable,
          dateTauxAvancementAnnuel: donnees.dateTauxAvancementAnnuel,
        }),
      ),
    );
    const regDonnéesParChantier = chantiers.map((chantier) =>
      Object.entries(chantier.mailles.regionale).map(
        ([codeInsee, donnees]) => ({
          territoireCode: donnees.territoireCode,
          codeInsee,
          avancementAnnuel: donnees.avancement.annuel,
          estApplicable: donnees.estApplicable,
          dateTauxAvancementAnnuel: donnees.dateTauxAvancementAnnuel,
        }),
      ),
    );
    const deptDonnéesParChantier = chantiers.map((chantier) =>
      Object.entries(chantier.mailles.departementale).map(
        ([codeInsee, donnees]) => ({
          territoireCode: donnees.territoireCode,
          codeInsee,
          avancementAnnuel: donnees.avancement.annuel,
          estApplicable: donnees.estApplicable,
          dateTauxAvancementAnnuel: donnees.dateTauxAvancementAnnuel,
        }),
      ),
    );

    const natAgrégé = agrégerTerritoiresDonnees(natDonnéesParChantier);
    const regAgrégé = agrégerTerritoiresDonnees(regDonnéesParChantier);
    const deptAgrégé = agrégerTerritoiresDonnees(deptDonnéesParChantier);

    const result: AvancementTerritoireViewModel[] = [];

    for (const [territoireCode, agregat] of natAgrégé) {
      result.push({
        territoireCode,
        territoireNom: territoiresMap.get(territoireCode)?.nomAffiché ?? "",
        codeInsee: agregat.codeInsee,
        maille: "NAT",
        avancementAnnuel: agregat.avancementAnnuel,
        estApplicable: agregat.estApplicable,
        dateTauxAvancementAnnuel: agregat.dateTauxAvancementAnnuel,
      });
    }

    for (const [territoireCode, agregat] of regAgrégé) {
      result.push({
        territoireCode,
        territoireNom: territoiresMap.get(territoireCode)?.nomAffiché ?? "",
        codeInsee: agregat.codeInsee,
        maille: "REG",
        avancementAnnuel: agregat.avancementAnnuel,
        estApplicable: agregat.estApplicable,
        dateTauxAvancementAnnuel: agregat.dateTauxAvancementAnnuel,
      });
    }

    for (const [territoireCode, agregat] of deptAgrégé) {
      result.push({
        territoireCode,
        territoireNom: territoiresMap.get(territoireCode)?.nomAffiché ?? "",
        codeInsee: agregat.codeInsee,
        maille: "DEPT",
        avancementAnnuel: agregat.avancementAnnuel,
        estApplicable: agregat.estApplicable,
        dateTauxAvancementAnnuel: agregat.dateTauxAvancementAnnuel,
      });
    }

    return result;
  }
}
