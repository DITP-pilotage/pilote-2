import type { PrismaPilote } from "@/server/db/PrismaPilote";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";
import type {
  ChatConversation,
  ChatConversationResume,
} from "@/server/albert/domain/ChatConversation";
import type { ChatConversationRepository } from "@/server/albert/domain/ChatConversationRepository";

export class PrismaChatConversationRepository implements ChatConversationRepository {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: { prisma: PrismaPilote }) {
    this.prisma = prisma;
  }

  async save(params: {
    id: string;
    utilisateurId: string;
    titre: string;
    messages: unknown;
    contexte: Record<string, unknown> | null;
  }): Promise<void> {
    const db = this.prisma.getInstance();
    const resultatMiseAJour = await db.chat_conversation.updateMany({
      where: { id: params.id, utilisateur_id: params.utilisateurId },
      data: {
        titre: params.titre,
        messages: params.messages as never,
        contexte: (params.contexte ?? null) as never,
      },
    });
    if (resultatMiseAJour.count > 0) return;

    const conversationExistante = await db.chat_conversation.findUnique({
      where: { id: params.id },
      select: { utilisateur_id: true },
    });
    if (conversationExistante) {
      throw new Error(
        "Conversation appartenant à un autre utilisateur — modification refusée.",
      );
    }

    await db.chat_conversation.create({
      data: {
        id: params.id,
        utilisateur_id: params.utilisateurId,
        titre: params.titre,
        messages: params.messages as never,
        contexte: (params.contexte ?? null) as never,
      },
    });
  }

  async recupererParId(params: {
    id: string;
    utilisateurId: string;
  }): Promise<ChatConversation | null> {
    const row = await this.prisma.getInstance().chat_conversation.findFirst({
      where: { id: params.id, utilisateur_id: params.utilisateurId },
    });
    if (!row) return null;
    return {
      id: row.id,
      utilisateurId: row.utilisateur_id,
      titre: row.titre,
      messages: row.messages as unknown as PiloteUIMessage[],
      contexte: row.contexte as Record<string, unknown> | null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async listerPourUtilisateur(params: {
    utilisateurId: string;
    limite: number;
  }): Promise<ChatConversationResume[]> {
    const rows = await this.prisma.getInstance().chat_conversation.findMany({
      where: { utilisateur_id: params.utilisateurId },
      orderBy: { updated_at: "desc" },
      take: params.limite,
      select: {
        id: true,
        utilisateur_id: true,
        titre: true,
        contexte: true,
        created_at: true,
        updated_at: true,
      },
    });
    return rows.map((row) => ({
      id: row.id,
      utilisateurId: row.utilisateur_id,
      titre: row.titre,
      contexte: row.contexte as Record<string, unknown> | null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async supprimer(params: {
    id: string;
    utilisateurId: string;
  }): Promise<void> {
    await this.prisma.getInstance().chat_conversation.deleteMany({
      where: { id: params.id, utilisateur_id: params.utilisateurId },
    });
  }

  async supprimerExpirees(params: { anterieurA: Date }): Promise<number> {
    const resultat = await this.prisma
      .getInstance()
      .chat_conversation.deleteMany({
        where: { updated_at: { lt: params.anterieurA } },
      });
    return resultat.count;
  }
}
