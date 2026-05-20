import { $Enums, Prisma } from "@prisma/client";
import type { Inject } from "@/server/albert/module";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";
import type { ConversationAdminResume } from "@/server/albert/queries/ListerConversationsAdminQuery";

export type ConversationAdminDetail = ConversationAdminResume & {
  messages: PiloteUIMessage[];
  contexte: Record<string, unknown> | null;
  llmCalls: Array<{
    id: string;
    evaluation: $Enums.llm_call_evaluation | null;
    commentaire: string | null;
    createdAt: Date;
  }>;
};

type LigneDetail = {
  id: string;
  titre: string;
  messages: unknown;
  contexte: unknown;
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
};

type LigneLlmCall = {
  id: string;
  evaluation: $Enums.llm_call_evaluation | null;
  commentaire: string | null;
  created_at: Date;
};

export class RecupererConversationAdminQuery {
  constructor(private readonly deps: Inject<"prisma">) {}

  async run(params: { id: string }): Promise<ConversationAdminDetail | null> {
    const db = this.deps.prisma.getInstance();

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
