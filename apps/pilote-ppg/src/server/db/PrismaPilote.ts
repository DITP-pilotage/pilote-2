import { getPrisma } from "@/server/db/PrismaTransaction";

/**
 * Point d'acces au client Prisma pour les repositories.
 *
 * `getInstance()` construisait un `PrismaClient` dedie — donc un pool `pg` de plus —
 * avant de renvoyer `getPrisma() || this.instance`. Comme `getPrisma()` renvoie
 * toujours une valeur, cette instance n'etait jamais utilisee : les 170 `new
 * PrismaPilote()` du code ouvraient chacun un pool pour rien, jusqu'a epuiser les
 * connexions de PostgreSQL.
 */
export class PrismaPilote {
  getInstance() {
    return getPrisma();
  }
}
