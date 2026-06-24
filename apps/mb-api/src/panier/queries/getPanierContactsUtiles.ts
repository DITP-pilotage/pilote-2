import { type PanierContactsUtilesApiModel } from '@pilote/mb-shared/panierContactUtile'
import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { withPanierReadPermission } from '@/panier/permissions'

export const getPanierContactsUtiles = (
  panierPublicId: string,
): ResultAsync<PanierContactsUtilesApiModel, never> => {
  const principalId = requireCurrentPrincipalId()
  return ResultAsync.fromSafePromise(
    db().panier.findFirstOrThrow({
      where: withPanierReadPermission({ publicId: panierPublicId }, principalId),
      include: {
        contactsUtiles: {
          include: {
            contactUtile: {
              include: {
                organisme: true,
              },
            },
          },
          orderBy: [
            { contactUtile: { organisme: { nom: 'asc' } } },
            { contactUtile: { nom: 'asc' } },
          ],
        },
      },
    }),
  ).map((panier) => {
    const grouped = new Map<
      string,
      {
        organisme: { id: string; nom: string }
        contacts: (typeof panier.contactsUtiles)[0]['contactUtile'][]
      }
    >()

    for (const joinRow of panier.contactsUtiles) {
      const c = joinRow.contactUtile
      const o = c.organisme
      if (!grouped.has(o.id)) {
        grouped.set(o.id, { organisme: { id: o.id, nom: o.nom }, contacts: [] })
      }
      grouped.get(o.id)!.contacts.push(c)
    }

    return {
      items: Array.from(grouped.values()).map(({ organisme, contacts }) => ({
        organisme,
        contacts: contacts.map((c) => ({
          id: c.id,
          nom: c.nom,
          description: c.description,
          telephone: c.telephone,
          email: c.email,
          url: c.url,
          adresse: c.adresse,
        })),
      })),
    }
  })
}
