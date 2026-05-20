import { Prisma } from "@prisma/client";
import type { Inject } from "@/server/albert/module";

export type TriListeConversationsAdmin = {
  champ: "createdAt" | "updatedAt";
  direction: "asc" | "desc";
};

export type ListerConversationsAdminParams = {
  page: number;
  taillePage: number;
  recherche?: string;
  avecPouce?: boolean;
  avecPouceBas?: boolean;
  avecCommentaire?: boolean;
  profilCodes?: string[];
  tri: TriListeConversationsAdmin;
};

export type ConversationAdminResume = {
  id: string;
  titre: string;
  extraitPremierMessageUser: string;
  utilisateur: {
    id: string;
    prenom: string;
    nom: string;
    email: string;
    profilCode: string;
    profilNom: string;
  };
  createdAt: Date;
  updatedAt: Date;
  nbPouce: number;
  nbPouceBas: number;
  nbCommentaire: number;
};

export type ListerConversationsAdminResult = {
  total: number;
  items: ConversationAdminResume[];
};

type LigneListe = {
  id: string;
  titre: string;
  extrait_premier_message_user: string;
  utilisateur_id: string;
  utilisateur_prenom: string;
  utilisateur_nom: string;
  utilisateur_email: string;
  profil_code: string;
  profil_nom: string;
  created_at: Date;
  updated_at: Date;
  nb_pouce: bigint;
  nb_pouce_bas: bigint;
  nb_commentaire: bigint;
  total: bigint;
};

export class ListerConversationsAdminQuery {
  constructor(private readonly deps: Inject<"prisma">) {}

  async run(
    params: ListerConversationsAdminParams,
  ): Promise<ListerConversationsAdminResult> {
    const db = this.deps.prisma.getInstance();
    const offset = (params.page - 1) * params.taillePage;
    const recherchePattern = params.recherche
      ? `%${params.recherche.toLowerCase()}%`
      : null;
    const profilCodesArray =
      params.profilCodes && params.profilCodes.length > 0
        ? params.profilCodes
        : null;

    const orderBy = ((): Prisma.Sql => {
      const direction =
        params.tri.direction === "asc" ? Prisma.sql`ASC` : Prisma.sql`DESC`;
      if (params.tri.champ === "createdAt") {
        return Prisma.sql`b.created_at ${direction}, b.id ${direction}`;
      }
      return Prisma.sql`b.updated_at ${direction}, b.id ${direction}`;
    })();

    const lignes = await db.$queryRaw<LigneListe[]>(Prisma.sql`
      WITH compteurs AS (
        SELECT
          lc.chat_id,
          COUNT(*) FILTER (WHERE lc.evaluation = 'POSITIVE') AS nb_pouce,
          COUNT(*) FILTER (WHERE lc.evaluation = 'NEGATIVE') AS nb_pouce_bas,
          COUNT(*) FILTER (WHERE lc.commentaire IS NOT NULL) AS nb_commentaire
        FROM llm_calls lc
        GROUP BY lc.chat_id
      ),
      base AS (
        SELECT
          c.id,
          c.titre,
          COALESCE(
            SUBSTRING((c.messages->0->'parts'->0->>'text'), 1, 160),
            ''
          ) AS extrait_premier_message_user,
          LOWER(COALESCE((c.messages->0->'parts'->0->>'text'), '')) AS premier_message_user_complet,
          u.id AS utilisateur_id,
          u.prenom AS utilisateur_prenom,
          u.nom AS utilisateur_nom,
          u.email AS utilisateur_email,
          p.code AS profil_code,
          p.nom AS profil_nom,
          c.created_at,
          c.updated_at,
          COALESCE(co.nb_pouce, 0) AS nb_pouce,
          COALESCE(co.nb_pouce_bas, 0) AS nb_pouce_bas,
          COALESCE(co.nb_commentaire, 0) AS nb_commentaire
        FROM chat_conversation c
        INNER JOIN utilisateur u ON u.id = c.utilisateur_id
        INNER JOIN profil p ON p.code = u.profil_code
        LEFT JOIN compteurs co ON co.chat_id = c.id::text
      )
      SELECT
        b.id,
        b.titre,
        b.extrait_premier_message_user,
        b.utilisateur_id,
        b.utilisateur_prenom,
        b.utilisateur_nom,
        b.utilisateur_email,
        b.profil_code,
        b.profil_nom,
        b.created_at,
        b.updated_at,
        b.nb_pouce,
        b.nb_pouce_bas,
        b.nb_commentaire,
        COUNT(*) OVER () AS total
      FROM base b
      WHERE
        (${recherchePattern}::text IS NULL
          OR LOWER(b.titre) LIKE ${recherchePattern}
          OR b.premier_message_user_complet LIKE ${recherchePattern})
        AND (${params.avecPouce ?? false}::boolean = false OR b.nb_pouce > 0)
        AND (${params.avecPouceBas ?? false}::boolean = false OR b.nb_pouce_bas > 0)
        AND (${params.avecCommentaire ?? false}::boolean = false OR b.nb_commentaire > 0)
        AND (${profilCodesArray}::text[] IS NULL OR b.profil_code = ANY(${profilCodesArray}::text[]))
      ORDER BY ${orderBy}
      LIMIT ${params.taillePage}
      OFFSET ${offset}
    `);

    const total = lignes.length > 0 ? Number(lignes[0].total) : 0;
    const items: ConversationAdminResume[] = lignes.map((ligne) => ({
      id: ligne.id,
      titre: ligne.titre,
      extraitPremierMessageUser: ligne.extrait_premier_message_user,
      utilisateur: {
        id: ligne.utilisateur_id,
        prenom: ligne.utilisateur_prenom,
        nom: ligne.utilisateur_nom,
        email: ligne.utilisateur_email,
        profilCode: ligne.profil_code,
        profilNom: ligne.profil_nom,
      },
      createdAt: ligne.created_at,
      updatedAt: ligne.updated_at,
      nbPouce: Number(ligne.nb_pouce),
      nbPouceBas: Number(ligne.nb_pouce_bas),
      nbCommentaire: Number(ligne.nb_commentaire),
    }));

    return { total, items };
  }
}
