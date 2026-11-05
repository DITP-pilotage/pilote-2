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

// Le filtre et le décompte partagent la même règle : une liste filtrée « avec commentaire »
// ne montre jamais 0 commentaire.
const avecCommentaire: Prisma.AssistantAppelWhereInput = {
  AND: [{ commentaire: { not: null } }, { NOT: { commentaire: '' } }],
}

const whereOf = (query: Query): Prisma.AssistantConversationWhereInput => ({
  ...(query.recherche ? { titre: { contains: query.recherche, mode: 'insensitive' } } : {}),
  AND: [
    ...(query.positif ? [{ appels: { some: { evaluation: 'POSITIVE' as const } } }] : []),
    ...(query.negatif ? [{ appels: { some: { evaluation: 'NEGATIVE' as const } } }] : []),
    ...(query.commentaire ? [{ appels: { some: avecCommentaire } }] : []),
    ...(query.categorie
      ? [{ appels: { some: { categoriesProbleme: { has: query.categorie } } } }]
      : []),
  ],
})

type Retours = Pick<
  AdminConversationList['items'][number],
  'reponses' | 'positifs' | 'negatifs' | 'commentaires'
>

const noRetours: Retours = { reponses: 0, positifs: 0, negatifs: 0, commentaires: 0 }

/** Comptés en base : une conversation chargée peut compter des dizaines d'appels. */
const countRetours = async (conversationIds: string[]): Promise<Map<string, Retours>> => {
  const [parEvaluation, parCommentaire] = await Promise.all([
    db().assistantAppel.groupBy({
      by: ['conversationId', 'evaluation'],
      where: { conversationId: { in: conversationIds } },
      _count: { _all: true },
    }),
    db().assistantAppel.groupBy({
      by: ['conversationId'],
      where: { conversationId: { in: conversationIds }, ...avecCommentaire },
      _count: { _all: true },
    }),
  ])
  const counts = new Map<string, Retours>()
  const of = (id: string): Retours => {
    const current = counts.get(id) ?? { ...noRetours }
    counts.set(id, current)
    return current
  }
  for (const group of parEvaluation) {
    const retours = of(group.conversationId)
    retours.reponses += group._count._all
    if (group.evaluation === 'POSITIVE') retours.positifs += group._count._all
    if (group.evaluation === 'NEGATIVE') retours.negatifs += group._count._all
  }
  for (const group of parCommentaire) of(group.conversationId).commentaires = group._count._all
  return counts
}

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
      },
    }),
  ])
  const counts = await countRetours(rows.map((row) => row.id))
  return {
    items: rows.map((row) => ({
      id: row.id,
      titre: row.titre,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      ...(counts.get(row.id) ?? noRetours),
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
