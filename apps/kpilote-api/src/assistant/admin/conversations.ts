import {
  ADMIN_PAGE_SIZE,
  type AdminConversation,
  type AdminConversationList,
  type adminConversationsQuerySchema,
} from '@pilote/kpilote-shared/assistant/admin'
import { type z } from 'zod'

import { NotFoundError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { type Prisma } from '@/generated/prisma/client'

type Query = z.output<typeof adminConversationsQuerySchema>

const hasCommentaire = (commentaire: string | null): boolean =>
  (commentaire ?? '').trim().length > 0

const whereOf = (query: Query): Prisma.AssistantConversationWhereInput => ({
  ...(query.recherche ? { titre: { contains: query.recherche, mode: 'insensitive' } } : {}),
  AND: [
    ...(query.positif ? [{ appels: { some: { evaluation: 'POSITIVE' as const } } }] : []),
    ...(query.negatif ? [{ appels: { some: { evaluation: 'NEGATIVE' as const } } }] : []),
    ...(query.commentaire
      ? [
          {
            appels: {
              some: { AND: [{ commentaire: { not: null } }, { NOT: { commentaire: '' } }] },
            },
          },
        ]
      : []),
    ...(query.categorie
      ? [{ appels: { some: { categoriesProbleme: { has: query.categorie } } } }]
      : []),
  ],
})

// Pseudonymisé : ni l'identifiant du principal, ni rien qui permette de le retrouver.
export const listAdminConversations = async (query: Query): Promise<AdminConversationList> => {
  const where = whereOf(query)
  const [total, rows] = await Promise.all([
    db().assistantConversation.count({ where }),
    db().assistantConversation.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (query.page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      select: {
        id: true,
        titre: true,
        createdAt: true,
        updatedAt: true,
        appels: { select: { evaluation: true, commentaire: true } },
      },
    }),
  ])
  return {
    items: rows.map((row) => ({
      id: row.id,
      titre: row.titre,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      reponses: row.appels.length,
      positifs: row.appels.filter((appel) => appel.evaluation === 'POSITIVE').length,
      negatifs: row.appels.filter((appel) => appel.evaluation === 'NEGATIVE').length,
      commentaires: row.appels.filter((appel) => hasCommentaire(appel.commentaire)).length,
    })),
    total,
    page: query.page,
    taillePage: ADMIN_PAGE_SIZE,
  }
}

export const getAdminConversation = async (id: string): Promise<AdminConversation> => {
  const row = await db().assistantConversation.findUnique({
    where: { id },
    select: {
      id: true,
      titre: true,
      createdAt: true,
      updatedAt: true,
      messages: true,
      appels: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          createdAt: true,
          modele: true,
          evaluation: true,
          categoriesProbleme: true,
          commentaire: true,
          inputTokens: true,
          outputTokens: true,
          dureeMs: true,
        },
      },
    },
  })
  if (!row) throw new NotFoundError('Conversation introuvable.')
  return {
    id: row.id,
    titre: row.titre,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    messages: Array.isArray(row.messages) ? row.messages : [],
    appels: row.appels.map(({ categoriesProbleme, createdAt, ...appel }) => ({
      ...appel,
      createdAt: createdAt.toISOString(),
      categories: categoriesProbleme,
    })),
  }
}
