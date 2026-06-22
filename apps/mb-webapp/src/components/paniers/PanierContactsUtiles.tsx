import { Globe, Mail, MapPin, Phone } from 'lucide-react'
import { useSuspenseQuery } from '@tanstack/react-query'

import { EmptyState } from '@/components/ui/EmptyState'
import { Heading } from '@/components/ui/Typography'
import { panierContactsUtilesQueryOptions } from '@/queries/paniers'

export function PanierContactsUtiles({ panierId }: { panierId: string }) {
  const { data } = useSuspenseQuery(panierContactsUtilesQueryOptions(panierId))

  if (data.items.length === 0) {
    return <EmptyState title="Aucun contact utile pour ce panier." />
  }

  return (
    <div className="space-y-6">
      <Heading size="sm">Contacts utiles</Heading>

      {data.items.map(({ organisme, contacts }) => (
        <div key={organisme.id} className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 whitespace-nowrap">
              {organisme.nom}
            </span>
            <hr className="flex-1 border-gray-200" />
          </div>

          <ul className="space-y-2">
            {contacts.map((contact) => (
              <li
                key={contact.id}
                className="rounded-lg border border-gray-200 bg-white p-4 space-y-2"
              >
                <p className="text-sm font-semibold text-gray-900">{contact.nom}</p>
                {contact.description && (
                  <p className="text-sm text-gray-500 italic">{contact.description}</p>
                )}
                {contact.telephone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone size={14} className="shrink-0 text-gray-400" />
                    <span>{contact.telephone}</span>
                  </div>
                )}
                {contact.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail size={14} className="shrink-0 text-gray-400" />
                    <a href={`mailto:${contact.email}`} className="hover:underline">
                      {contact.email}
                    </a>
                  </div>
                )}
                {contact.url && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Globe size={14} className="shrink-0 text-gray-400" />
                    <a
                      href={contact.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline truncate max-w-xs"
                    >
                      {contact.url.length > 50 ? contact.url.slice(0, 50) + '…' : contact.url}
                    </a>
                  </div>
                )}
                {contact.adresse && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin size={14} className="shrink-0 text-gray-400" />
                    <span>{contact.adresse}</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
