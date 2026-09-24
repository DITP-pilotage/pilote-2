import { fixtures } from "@/server/infrastructure/test/fixtures";
import { indicateurDuChantier } from "./world";

/**
 * Briques de données réutilisables, appelées depuis la `task` d'un cas.
 *
 * Les seuils viennent de `GetChantiersQuery` : en retard si l'écart à la
 * médiane est <= -10 ; en difficulté si le chantier n'est pas en retard et que
 * sa météo est ORAGE ou NUAGE. Les valeurs sont franchement de part et d'autre
 * du seuil — un cas d'eval ne doit pas basculer sur un arrondi.
 */

export type TerritoireRef = {
  territoire_code: string;
  code_insee: string;
  maille: "NAT" | "REG" | "DEPT";
  zone_id: string;
};

const ECART_EN_RETARD = -15;
const ECART_A_L_HEURE = 2;
const CURRENT_JALON = 2025;

async function seedChantierTerritoire({
  chantierId,
  territoire,
  meteo,
  ecart,
  taux,
}: {
  chantierId: string;
  territoire: TerritoireRef;
  meteo: string;
  ecart: number;
  taux: number;
}) {
  // `est_applicable` n'a pas de valeur par défaut en base et le `where` de
  // GetChantiersQuery filtre dessus : sans ce champ, le chantier n'existe pas
  // pour l'outil, sans qu'aucune erreur ne le signale.
  await fixtures.chantierTerritoire({
    id: chantierId,
    ...territoire,
    meteo,
    est_applicable: true,
  });

  await fixtures.chantierTerritoireJalon({
    id: chantierId,
    ...territoire,
    jalon: CURRENT_JALON,
    ecart,
    taux_avancement: taux,
  });

  // Un indicateur chiffré sur le même territoire. Les scénarios de l'interface
  // demandent systématiquement « et les valeurs de leurs indicateurs » ; sans
  // lui, l'agent produit une section « Aucun indicateur disponible » que le
  // juge note — à juste titre — comme du remplissage.
  await fixtures.indicateurTerritoire({
    id: indicateurDuChantier(chantierId),
    chantier_id: chantierId,
    ...territoire,
    est_applicable: true,
    valeur_initiale: 20,
    valeur_actuelle_mandat: taux,
    valeur_cible_mandat: 100,
  });
}

export async function seedChantierEnRetard({
  chantierId,
  territoire,
}: {
  chantierId: string;
  territoire: TerritoireRef;
}) {
  await seedChantierTerritoire({
    chantierId,
    territoire,
    meteo: "SOLEIL",
    ecart: ECART_EN_RETARD,
    taux: 34,
  });
}

export async function seedChantierEnDifficulte({
  chantierId,
  territoire,
}: {
  chantierId: string;
  territoire: TerritoireRef;
}) {
  await seedChantierTerritoire({
    chantierId,
    territoire,
    meteo: "ORAGE",
    ecart: ECART_A_L_HEURE,
    taux: 58,
  });
}

export async function seedChantierWithTaux({
  chantierId,
  territoire,
  taux,
}: {
  chantierId: string;
  territoire: TerritoireRef;
  taux: number;
}) {
  await seedChantierTerritoire({
    chantierId,
    territoire,
    meteo: "SOLEIL",
    ecart: ECART_A_L_HEURE,
    taux,
  });
}
