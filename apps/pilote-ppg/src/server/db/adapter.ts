import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// Prisma 7 exige un driver adapter : `new PrismaClient()` sans argument leve
// PrismaClientInitializationError a la construction. Le typage ne l'exprime pas
// (`adapter` est optionnel dans les types generes), donc tsc ne voit rien —
// seul le runtime le dit.
//
// Contournement d'un bug amont, prisma/prisma#27823 (ouvert, non confirme) :
// le driver `pg` ne connait pas l'OID des tableaux d'ENUMS PostgreSQL et rend le
// litteral brut `"{a,b}"` la ou le moteur Rust de Prisma 6 rendait un tableau.
// Mesure : `text[]` est bien parse, `maille[]` non. Quatre champs de ppg sont
// concernes — chantier_identite.mailles_applicables,
// indicateur_identite.mailles_applicables, utilisateur.applications_accessibles
// et llm_calls.categories_probleme — et un seul est couvert par un test.
//
// Le correctif reutilise le parseur de tableau de texte de `pg` lui-meme (OID 1009,
// `_text`) pour chaque OID de tableau d'enum, decouvert dans pg_type. Les OID des
// types personnalises sont propres a chaque base, donc la decouverte doit etre faite
// a l'execution.
//
// A retirer des que l'amont corrige.

// `TypeId` de pg-types n'enumere que les OID scalaires : 1009 (`_text`) est valide
// au runtime mais absent de l'union. La conversion est etroite et volontaire.
const OID_TABLEAU_DE_TEXTE = 1009 as Parameters<
  typeof pg.types.getTypeParser
>[0];

async function enregistrerParseursDeTableauxDEnums(
  pool: pg.Pool,
): Promise<void> {
  const parseurDeTableau = pg.types.getTypeParser(OID_TABLEAU_DE_TEXTE);
  const { rows } = await pool.query<{ array_oid: number }>(
    `select a.oid::int as array_oid
       from pg_type t
       join pg_type a on a.oid = t.typarray
      where t.typtype = 'e'`,
  );
  for (const { array_oid } of rows) {
    pg.types.setTypeParser(array_oid, parseurDeTableau);
  }
}

/**
 * Enveloppe le pool pour qu'aucune requete ne soit servie avant que les parseurs
 * soient enregistres. Sans cette barriere, les toutes premieres requetes de
 * l'application rendraient encore des chaines, de facon non deterministe.
 */
function poolAvecParseursPrets(pool: pg.Pool, pret: Promise<void>): pg.Pool {
  return new Proxy(pool, {
    get(cible, propriete, recepteur) {
      if (propriete === "query") {
        return async (...args: unknown[]) => {
          await pret;
          return (cible.query as (...a: unknown[]) => unknown)(...args);
        };
      }
      if (propriete === "connect") {
        return async (...args: unknown[]) => {
          await pret;
          return (cible.connect as (...a: unknown[]) => unknown)(...args);
        };
      }
      const valeur = Reflect.get(cible, propriete, recepteur);
      return typeof valeur === "function" ? valeur.bind(cible) : valeur;
    },
  });
}

export function creerAdapter(): PrismaPg {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL est requis pour construire l'adapter Prisma.",
    );
  }
  const pool = new pg.Pool({ connectionString });
  const pret = enregistrerParseursDeTableauxDEnums(pool);
  return new PrismaPg(poolAvecParseursPrets(pool, pret));
}
