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

export class GetChantierAvancementsTerritoiresQuery {
  constructor(
    private readonly deps: Inject<
      "recupererChantierUseCaseV2" | "territoireRepository"
    >,
  ) {}

  async execute(params: {
    chantierId: string;
    jalon: number;
    habilitations: Habilitations;
    profil: ProfilCode;
  }): Promise<AvancementTerritoireViewModel[]> {
    const chantier = await this.deps.recupererChantierUseCaseV2.run(
      params.chantierId,
      params.habilitations,
      params.profil,
      params.jalon,
    );

    const territoires = await this.deps.territoireRepository.récupérerTousNew();
    const territoiresMap = new Map(
      territoires.map((territoire) => [territoire.code, territoire]),
    );

    const result: AvancementTerritoireViewModel[] = [];

    for (const [codeInsee, donnees] of Object.entries(
      chantier.mailles.nationale,
    )) {
      const territoire = territoiresMap.get(donnees.territoireCode);
      result.push({
        territoireCode: donnees.territoireCode,
        territoireNom: territoire?.nomAffiché ?? "",
        codeInsee,
        maille: "NAT",
        avancementAnnuel: donnees.avancement.annuel,
        estApplicable: donnees.estApplicable,
        dateTauxAvancementAnnuel: donnees.dateTauxAvancementAnnuel,
      });
    }

    for (const [codeInsee, donnees] of Object.entries(
      chantier.mailles.regionale,
    )) {
      const territoire = territoiresMap.get(donnees.territoireCode);
      result.push({
        territoireCode: donnees.territoireCode,
        territoireNom: territoire?.nomAffiché ?? "",
        codeInsee,
        maille: "REG",
        avancementAnnuel: donnees.avancement.annuel,
        estApplicable: donnees.estApplicable,
        dateTauxAvancementAnnuel: donnees.dateTauxAvancementAnnuel,
      });
    }

    for (const [codeInsee, donnees] of Object.entries(
      chantier.mailles.departementale,
    )) {
      const territoire = territoiresMap.get(donnees.territoireCode);
      result.push({
        territoireCode: donnees.territoireCode,
        territoireNom: territoire?.nomAffiché ?? "",
        codeInsee,
        maille: "DEPT",
        avancementAnnuel: donnees.avancement.annuel,
        estApplicable: donnees.estApplicable,
        dateTauxAvancementAnnuel: donnees.dateTauxAvancementAnnuel,
      });
    }

    return result;
  }
}
