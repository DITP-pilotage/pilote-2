import { createFileRoute } from '@tanstack/react-router'

import { Heading, Text } from '@pilote/kpilote-ui/Typography'

export const Route = createFileRoute('/mentions-legales')({
  component: MentionsLegalesPage,
})

function MentionsLegalesPage() {
  return (
    <div className="space-y-8">
      <Heading as="h1" size="display-md" tone="primary">
        Mentions légales
      </Heading>

      <section className="space-y-3">
        <Heading as="h2" size="lg">
          Éditeur
        </Heading>
        <Text>
          Ce site est édité par la Direction Interministérielle de la Transformation Publique.
        </Text>
        <ul>
          <Text as="li">20 avenue de Ségur</Text>
          <Text as="li">75334 Paris Cedex 07</Text>
          <Text as="li">France</Text>
        </ul>
        <Text>
          <a
            href="https://www.modernisation.gouv.fr"
            className="text-primary underline"
            target="_blank"
            rel="noreferrer"
          >
            https://www.modernisation.gouv.fr
          </a>
        </Text>
      </section>

      <section className="space-y-3">
        <Heading as="h2" size="lg">
          Direction de la publication
        </Heading>
        <Text>
          Ce site est édité par la Direction Interministérielle de la Transformation Publique.
        </Text>
      </section>

      <section className="space-y-3">
        <Heading as="h2" size="lg">
          Responsable éditoriale
        </Heading>
        <Text>Cécile Le Guen</Text>
      </section>

      <section className="space-y-3">
        <Heading as="h2" size="lg">
          Hébergement
        </Heading>
        <ul>
          <Text as="li">Scalingo SAS</Text>
          <Text as="li">3 place de Haguenau</Text>
          <Text as="li">67000 Strasbourg</Text>
          <Text as="li">France</Text>
        </ul>
        <Text>SIRET 80866548300018</Text>
        <Text>
          <a
            href="https://scalingo.com/fr"
            className="text-primary underline"
            target="_blank"
            rel="noreferrer"
          >
            https://scalingo.com/fr
          </a>
        </Text>
      </section>
    </div>
  )
}
