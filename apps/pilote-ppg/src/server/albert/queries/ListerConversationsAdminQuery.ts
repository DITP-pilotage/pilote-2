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
  aPouce: boolean;
  aPouceBas: boolean;
  aCommentaire: boolean;
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
  a_pouce: boolean;
  a_pouce_bas: boolean;
  a_commentaire: boolean;
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
      WITH base AS (
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
          EXISTS (
            SELECT 1 FROM llm_calls lc
            WHERE lc.chat_id = c.id::text AND lc.evaluation = 'POSITIVE'
          ) AS a_pouce,
          EXISTS (
            SELECT 1 FROM llm_calls lc
            WHERE lc.chat_id = c.id::text AND lc.evaluation = 'NEGATIVE'
          ) AS a_pouce_bas,
          EXISTS (
            SELECT 1 FROM llm_calls lc
            WHERE lc.chat_id = c.id::text AND lc.commentaire IS NOT NULL
          ) AS a_commentaire
        FROM chat_conversation c
        INNER JOIN utilisateur u ON u.id = c.utilisateur_id
        INNER JOIN profil p ON p.code = u.profil_code
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
        b.a_pouce,
        b.a_pouce_bas,
        b.a_commentaire,
        COUNT(*) OVER () AS total
      FROM base b
      WHERE
        (${recherchePattern}::text IS NULL
          OR LOWER(b.titre) LIKE ${recherchePattern}
          OR b.premier_message_user_complet LIKE ${recherchePattern})
        AND (${params.avecPouce ?? false}::boolean = false OR b.a_pouce = true)
        AND (${params.avecPouceBas ?? false}::boolean = false OR b.a_pouce_bas = true)
        AND (${params.avecCommentaire ?? false}::boolean = false OR b.a_commentaire = true)
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
      aPouce: ligne.a_pouce,
      aPouceBas: ligne.a_pouce_bas,
      aCommentaire: ligne.a_commentaire,
    }));

    return { total, items };
  }
}
