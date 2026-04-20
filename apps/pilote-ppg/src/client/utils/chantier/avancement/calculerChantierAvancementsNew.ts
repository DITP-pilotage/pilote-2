import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import { AgrégateurChantiersParTerritoire } from "@/client/utils/chantier/agrégateur/agrégateur";
import { AvancementsStatistiques } from "@/components/_commons/Avancements/Avancements.interface";
import { territoireCodeVersMailleCodeInsee } from "@/server/utils/territoires";
import Chantier from "@/server/domain/chantier/Chantier.interface";

export default function calculerChantierAvancements(
  chantier: Chantier,
  mailleSélectionnée: MailleInterne,
  territoireCode: string,
  territoireCodeParent: string | null,
  avancementsAgrégés: AvancementsStatistiques,
) {
  const donnéesTerritoiresAgrégées = new AgrégateurChantiersParTerritoire(
    chantier,
  ).agréger();

  const avancementRégional = (typeTauxAvancement: "global" | "annuel") => {
    const { maille } = territoireCodeVersMailleCodeInsee(territoireCode);

    if (maille === "REG") {
      const avancement =
        donnéesTerritoiresAgrégées.regionale.territoires[territoireCode]
          .répartition.avancements[typeTauxAvancement];
      return { moyenne: avancement.avancement, date: avancement.date };
    } else if (maille === "DEPT" && territoireCodeParent) {
      const avancement =
        donnéesTerritoiresAgrégées.regionale.territoires[territoireCodeParent]
          .répartition.avancements[typeTauxAvancement];
      return { moyenne: avancement.avancement, date: avancement.date };
    } else {
      return { moyenne: null, date: null };
    }
  };

  const avancementDépartemental = (typeTauxAvancement: "global" | "annuel") => {
    const { maille } = territoireCodeVersMailleCodeInsee(territoireCode);

    if (maille === "DEPT") {
      const avancement =
        donnéesTerritoiresAgrégées[mailleSélectionnée].territoires[
          territoireCode
        ].répartition.avancements[typeTauxAvancement];
      return { moyenne: avancement.avancement, date: avancement.date };
    }
    return { moyenne: null, date: null };
  };

  return {
    nationale: {
      global: {
        moyenne:
          donnéesTerritoiresAgrégées.nationale.territoires["NAT-FR"].répartition
            .avancements.global.avancement,
        médiane: avancementsAgrégés?.médiane ?? null,
        minimum: avancementsAgrégés?.minimum ?? null,
        maximum: avancementsAgrégés?.maximum ?? null,
        date: donnéesTerritoiresAgrégées.nationale.territoires["NAT-FR"]
          .répartition.avancements.global.date,
      },
      annuel: {
        moyenne:
          donnéesTerritoiresAgrégées.nationale.territoires["NAT-FR"].répartition
            .avancements.annuel.avancement,
        date: donnéesTerritoiresAgrégées.nationale.territoires["NAT-FR"]
          .répartition.avancements.annuel.date,
      },
    },
    departementale: {
      global: {
        ...avancementDépartemental("global"),
      },
      annuel: {
        ...avancementDépartemental("annuel"),
      },
    },
    regionale: {
      global: {
        ...avancementRégional("global"),
      },
      annuel: {
        ...avancementRégional("annuel"),
      },
    },
  };
}
