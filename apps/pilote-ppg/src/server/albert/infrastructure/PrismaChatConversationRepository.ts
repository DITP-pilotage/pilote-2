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

  async upsert(params: {
    id: string;
    utilisateurId: string;
    titre: string;
    messages: unknown;
    territoireCode: string | null;
    jalon: number | null;
  }): Promise<void> {
    await this.prisma.getInstance().chat_conversation.upsert({
      where: { id: params.id },
      create: {
        id: params.id,
        utilisateur_id: params.utilisateurId,
        titre: params.titre,
        messages: params.messages as never,
        territoire_code: params.territoireCode,
        jalon: params.jalon,
      },
      update: {
        titre: params.titre,
        messages: params.messages as never,
        territoire_code: params.territoireCode,
        jalon: params.jalon,
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
      territoireCode: row.territoire_code,
      jalon: row.jalon,
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
        territoire_code: true,
        jalon: true,
        created_at: true,
        updated_at: true,
      },
    });
    return rows.map((row) => ({
      id: row.id,
      utilisateurId: row.utilisateur_id,
      titre: row.titre,
      territoireCode: row.territoire_code,
      jalon: row.jalon,
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
