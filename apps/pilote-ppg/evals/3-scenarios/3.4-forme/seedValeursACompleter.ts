import { configuration } from "@/config";
import { getAnneeDateDeBascule } from "@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/getAnneeDateDeBascule";
import { getPrisma } from "@/server/framework/persistence/PrismaTransaction";
import { fixtures } from "@/test/fixtures";
import type { TerritoireRef } from "../../seeds";
import { TERRITOIRES } from "../territoires";

// Le jalon que lisent les outils de valeurs initiales et cibles, calculé comme
// get_indicateurs_a_completer.
const JALON_OUTILS = getAnneeDateDeBascule(
  new Date(),
  configuration().dateBasculeAffichageValeursAnneePrecedente,
);

async function sansValeurInitiale({
  indicateurId,
  territoire,
}: {
  indicateurId: string;
  territoire: TerritoireRef;
}) {
  await getPrisma().indicateur_territoire.updateMany({
    where: { id: indicateurId, territoire_code: territoire.territoire_code },
    data: { valeur_initiale: null },
  });
}

async function sansValeurCible({
  indicateurId,
  territoire,
}: {
  indicateurId: string;
  territoire: TerritoireRef;
}) {
  await fixtures.indicateurTerritoireJalon({
    id: indicateurId,
    ...territoire,
    jalon: JALON_OUTILS,
    valeur_cible: null,
  });
}

// La clé étrangère de l'indicateur territorial pointe le chantier territorial.
async function chantierRegional({
  chantierId,
  territoire,
}: {
  chantierId: string;
  territoire: TerritoireRef;
}) {
  await fixtures.chantierTerritoire({
    id: chantierId,
    ...territoire,
    est_applicable: true,
  });
}

async function indicateurRegional({
  indicateurId,
  chantierId,
  territoire,
}: {
  indicateurId: string;
  chantierId: string;
  territoire: TerritoireRef;
}) {
  await fixtures.indicateurTerritoire({
    id: indicateurId,
    chantier_id: chantierId,
    ...territoire,
    est_applicable: true,
    valeur_initiale: 10,
  });
}

/**
 * Les lignes que le monde territorial ne sème pas : toutes ses valeurs
 * initiales et cibles sont renseignées, et les outils de valeurs initiales et
 * cibles ne renverraient rien. Les valeurs d'avancement ne sont à jour nulle
 * part : tout indicateur applicable remonte déjà au titre de la VA.
 *
 * - CH-001 et CH-005 : un même territoire cumule plusieurs motifs, et
 *   plusieurs indicateurs d'un chantier touchent les mêmes territoires.
 * - CH-007 : une seule ligne régionale (REG-53), aucune départementale.
 * - CH-018 : deux indicateurs sur REG-53, sans VI, dont un sans VC.
 */
export async function seedValeursACompleter() {
  const { bretagne, cotesDArmor, finistere, illeEtVilaine } = TERRITOIRES;

  await sansValeurInitiale({
    indicateurId: "IND-001",
    territoire: cotesDArmor,
  });
  await sansValeurInitiale({ indicateurId: "IND-001", territoire: finistere });
  await sansValeurCible({ indicateurId: "IND-001", territoire: cotesDArmor });

  await sansValeurCible({ indicateurId: "IND-005", territoire: bretagne });
  await sansValeurInitiale({
    indicateurId: "IND-005",
    territoire: illeEtVilaine,
  });

  await chantierRegional({ chantierId: "CH-007", territoire: bretagne });
  await indicateurRegional({
    indicateurId: "IND-007",
    chantierId: "CH-007",
    territoire: bretagne,
  });
  await sansValeurInitiale({ indicateurId: "IND-007", territoire: bretagne });
  await sansValeurCible({ indicateurId: "IND-007", territoire: bretagne });

  await chantierRegional({ chantierId: "CH-018", territoire: bretagne });
  for (const indicateurId of ["IND-018", "IND-894"]) {
    await indicateurRegional({
      indicateurId,
      chantierId: "CH-018",
      territoire: bretagne,
    });
    await sansValeurInitiale({ indicateurId, territoire: bretagne });
  }
  await sansValeurCible({ indicateurId: "IND-894", territoire: bretagne });
}
