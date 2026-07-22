import { createFileRoute } from '@tanstack/react-router'

import { Heading, Text } from '@pilote/kpilote-ui/Typography'

export const Route = createFileRoute('/accessibilite')({
  component: AccessibilitePage,
})

function AccessibilitePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Heading as="h1" size="display-md" tone="primary">
        Accessibilité
      </Heading>

      <section className="space-y-3">
        <Heading as="h2" size="lg">
          Déclaration d'accessibilité
        </Heading>
        <Text>
          La Direction interministérielle de la transformation publique s'engage à rendre son
          service accessible, conformément à l'article 47 de la loi n° 2005-102 du 11 février 2005.
        </Text>
        <Text>
          À cette fin, nous mettons en œuvre la stratégie et les actions suivantes :
          <br />
          <a
            href="https://www.modernisation.gouv.fr/files/2022-10/schema-pluriannuel-2022-2025-ditp.pdf"
            target="_blank"
            rel="noreferrer"
            className="text-primary underline"
          >
            https://www.modernisation.gouv.fr/files/2022-10/schema-pluriannuel-2022-2025-ditp.pdf
          </a>
        </Text>
        <Text>
          Cette déclaration d'accessibilité s'applique à PILOTE (pilote.ditp@modernisation.gouv.fr).
        </Text>
      </section>

      <section className="space-y-3">
        <Heading as="h2" size="lg">
          Etat de conformité
        </Heading>
        <Text>PILOTE est non conforme avec le RGAA. Le site n'a pas encore été audité.</Text>
      </section>

      <section className="space-y-3">
        <Heading as="h2" size="lg">
          Amélioration et contact
        </Heading>
        <Text>
          Si vous n'arrivez pas à accéder à un contenu ou à un service, vous pouvez contacter
          l'équipe de PILOTE pour être orienté vers une alternative accessible ou obtenir le contenu
          sous une autre forme.
        </Text>
        <ul className="list-disc space-y-1 pl-5">
          <Text as="li">E-mail: pilote.ditp@modernisation.gouv.fr</Text>
          <Text as="li">Adresse : DITP, 20 avenue de Ségur, 75007 Paris France</Text>
        </ul>
        <Text>Nous essayons de répondre dans les 5 jours ouvrés suivant la demande.</Text>
      </section>

      <section className="space-y-3">
        <Heading as="h2" size="lg">
          Voie de recours
        </Heading>
        <Text>
          Cette procédure est à utiliser dans le cas suivant : vous avez signalé au responsable du
          site internet un défaut d'accessibilité qui vous empêche d'accéder à un contenu ou à un
          des services du portail et vous n'avez pas obtenu de réponse satisfaisante.
        </Text>
        <Text>Vous pouvez :</Text>
        <ul className="list-disc space-y-1 pl-5">
          <Text as="li">
            Écrire un message au{' '}
            <a
              href="https://formulaire.defenseurdesdroits.fr/formulaire_saisine/"
              target="_blank"
              rel="noreferrer"
              className="text-primary underline"
            >
              Défenseur des droits
            </a>
          </Text>
          <Text as="li">
            Contacter{' '}
            <a
              href="https://www.defenseurdesdroits.fr/carte-des-delegues"
              target="_blank"
              rel="noreferrer"
              className="text-primary underline"
            >
              le délégué du Défenseur des droits dans votre région
            </a>
          </Text>
          <Text as="li">
            Envoyer un courrier par la poste (gratuit, ne pas mettre de timbre) : Défenseur des
            droits Libre réponse 71120 75342 Paris CEDEX 07
          </Text>
        </ul>
        <Text>
          Cette déclaration d'accessibilité a été créé le 28 juillet 2023 grâce au{' '}
          <a
            href="https://betagouv.github.io/a11y-generateur-declaration/#create"
            target="_blank"
            rel="noreferrer"
            className="text-primary underline"
          >
            Générateur de Déclaration d'Accessibilité de BetaGouv.
          </a>
        </Text>
      </section>
    </div>
  )
}
