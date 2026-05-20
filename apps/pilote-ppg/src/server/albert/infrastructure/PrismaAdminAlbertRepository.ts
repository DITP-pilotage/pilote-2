import { $Enums, Prisma } from "@prisma/client";
import type { PrismaPilote } from "@/server/db/PrismaPilote";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";
import type {
  AdminAlbertRepository,
  ConversationAdminDetail,
  ConversationAdminResume,
  ListerConversationsParams,
  ListerConversationsResult,
} from "@/server/albert/domain/AdminAlbertRepository";

type LigneBaseConversation = {
  id: string;
  titre: string;
  extrait_premier_message_user: string | null;
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
};

type LigneListe = LigneBaseConversation & { total: bigint };
type LigneDetail = LigneBaseConversation & {
  messages: unknown;
  contexte: unknown;
};

type LigneLlmCall = {
  id: string;
  evaluation: $Enums.llm_call_evaluation | null;
  commentaire: string | null;
  created_at: Date;
};

export class PrismaAdminAlbertRepository implements AdminAlbertRepository {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: { prisma: PrismaPilote }) {
    this.prisma = prisma;
  }

  async listerConversations(
    params: ListerConversationsParams,
  ): Promise<ListerConversationsResult> {
    const db = this.prisma.getInstance();

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
        b.*,
        COUNT(*) OVER () AS total
      FROM base b
      WHERE
        (${recherchePattern}::text IS NULL
          OR LOWER(b.titre) LIKE ${recherchePattern}
          OR LOWER(b.extrait_premier_message_user) LIKE ${recherchePattern})
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
      extraitPremierMessageUser: ligne.extrait_premier_message_user ?? "",
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

  async recupererConversation(params: {
    id: string;
  }): Promise<ConversationAdminDetail | null> {
    const db = this.prisma.getInstance();

    const lignes = await db.$queryRaw<LigneDetail[]>(Prisma.sql`
      SELECT
        c.id,
        c.titre,
        c.messages,
        c.contexte,
        COALESCE(
          SUBSTRING((c.messages->0->'parts'->0->>'text'), 1, 160),
          ''
        ) AS extrait_premier_message_user,
        u.id AS utilisateur_id,
        u.prenom AS utilisateur_prenom,
        u.nom AS utilisateur_nom,
        u.email AS utilisateur_email,
        p.code AS profil_code,
        p.nom AS profil_nom,
        c.created_at,
        c.updated_at,
        EXISTS (SELECT 1 FROM llm_calls lc WHERE lc.chat_id = c.id::text AND lc.evaluation = 'POSITIVE') AS a_pouce,
        EXISTS (SELECT 1 FROM llm_calls lc WHERE lc.chat_id = c.id::text AND lc.evaluation = 'NEGATIVE') AS a_pouce_bas,
        EXISTS (SELECT 1 FROM llm_calls lc WHERE lc.chat_id = c.id::text AND lc.commentaire IS NOT NULL) AS a_commentaire
      FROM chat_conversation c
      INNER JOIN utilisateur u ON u.id = c.utilisateur_id
      INNER JOIN profil p ON p.code = u.profil_code
      WHERE c.id = ${params.id}::uuid
      LIMIT 1
    `);

    if (lignes.length === 0) return null;
    const ligne = lignes[0];

    const llmCallsLignes = await db.$queryRaw<LigneLlmCall[]>(Prisma.sql`
      SELECT id, evaluation, commentaire, created_at
      FROM llm_calls
      WHERE chat_id = ${params.id}::text
      ORDER BY created_at ASC
    `);

    return {
      id: ligne.id,
      titre: ligne.titre,
      extraitPremierMessageUser: ligne.extrait_premier_message_user ?? "",
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
      messages: ligne.messages as unknown as PiloteUIMessage[],
      contexte: ligne.contexte as Record<string, unknown> | null,
      llmCalls: llmCallsLignes.map((row) => ({
        id: row.id,
        evaluation: row.evaluation,
        commentaire: row.commentaire,
        createdAt: row.created_at,
      })),
    };
  }
}
