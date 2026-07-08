import { type DossierContactsUtilesGroup } from '@pilote/kpilote-shared/dossierContactUtile'
import { Globe, Mail, MapPin, Phone } from 'lucide-react'

import { EmptyState } from '@pilote/kpilote-ui/EmptyState'
import { Heading } from '@pilote/kpilote-ui/Typography'

export function DossierContactsUtiles({
  contactsUtiles,
}: {
  contactsUtiles: ReadonlyArray<DossierContactsUtilesGroup>
}) {
  if (contactsUtiles.length === 0) {
    return <EmptyState title="Aucun contact utile pour ce dossier." />
  }

  return (
    <div className="space-y-6">
      <Heading size="sm">Contacts utiles</Heading>

      {contactsUtiles.map(({ organisme, contacts }) => (
        <div key={organisme.id} className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-text-subtle whitespace-nowrap">
              {organisme.nom}
            </span>
            <hr className="flex-1 border-border" />
          </div>

          <ul className="space-y-2">
            {contacts.map((contact) => (
              <li
                key={contact.id}
                className="rounded-lg border border-border bg-surface p-4 space-y-2"
              >
                <p className="text-sm font-semibold text-text">{contact.nom}</p>
                {contact.description && (
                  <p className="text-sm text-text-muted italic">{contact.description}</p>
                )}
                {contact.telephone && (
                  <div className="flex items-center gap-2 text-sm text-text-muted">
                    <Phone size={14} className="shrink-0 text-text-subtle" />
                    <span>{contact.telephone}</span>
                  </div>
                )}
                {contact.email && (
                  <div className="flex items-center gap-2 text-sm text-text-muted">
                    <Mail size={14} className="shrink-0 text-text-subtle" />
                    <a
                      href={`mailto:${contact.email}`}
                      aria-label={`Envoyer un email à ${contact.email}`}
                      className="hover:underline"
                    >
                      {contact.email}
                    </a>
                  </div>
                )}
                {contact.url && (
                  <div className="flex items-center gap-2 text-sm text-text-muted">
                    <Globe size={14} className="shrink-0 text-text-subtle" />
                    <a
                      href={contact.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline truncate max-w-xs"
                    >
                      {contact.url}
                    </a>
                  </div>
                )}
                {contact.adresse && (
                  <div className="flex items-center gap-2 text-sm text-text-muted">
                    <MapPin size={14} className="shrink-0 text-text-subtle" />
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
