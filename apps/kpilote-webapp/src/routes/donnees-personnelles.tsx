import { createFileRoute } from '@tanstack/react-router'

import { Heading, Text } from '@pilote/kpilote-ui/Typography'

export const Route = createFileRoute('/donnees-personnelles')({
  component: DonneesPersonnellesPage,
})

function DonneesPersonnellesPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <Heading as="h1" size="display-md" tone="primary">
        Données personnelles et cookies
      </Heading>

      <section className="space-y-3">
        <Heading as="h2" size="lg">
          Responsable de traitement
        </Heading>
        <Text>
          La Direction interministérielle de la transformation publique (mission Pilotage), située
          au 20 avenue de Ségur, 75007 Paris, est responsable du traitement des données personnelles
          pour le site PILOTE et ses fonctionnalités, y compris le chatbot expérimental.
        </Text>
        <Text>
          Pour toute question relative à la protection des données, vous pouvez contacter :
        </Text>
        <ul className="list-disc space-y-1 pl-5">
          <Text as="li">
            Par email :{' '}
            <a
              href="mailto:contactrgpd.ditp@modernisation.gouv.fr"
              className="text-primary underline"
            >
              contactrgpd.ditp@modernisation.gouv.fr
            </a>
          </Text>
          <Text as="li">
            Par voie postale : Direction interministérielle de la transformation publique TSA 70732
            75334 Paris Cedex 07
          </Text>
        </ul>
      </section>

      <section className="space-y-3">
        <Heading as="h2" size="lg">
          Cookies
        </Heading>

        <div className="space-y-3">
          <Heading as="h3" size="md">
            Informations sur les cookies
          </Heading>
          <Text>
            Lors de la consultation de notre site{' '}
            <a
              href="https://pilote.modernisation.gouv.fr"
              target="_blank"
              rel="noreferrer"
              className="text-primary underline"
            >
              https://pilote.modernisation.gouv.fr
            </a>
            , des cookies sont déposés sur votre ordinateur, mobile ou tablette.
          </Text>
          <Text>
            <span className="font-semibold">Définition d&apos;un cookie :</span> Un cookie est un
            fichier texte déposé sur votre terminal lors de la visite d&apos;un site. Il permet de
            collecter des informations relatives à votre navigation et de vous proposer des services
            adaptés.
          </Text>
        </div>

        <div className="space-y-3">
          <Heading as="h3" size="md">
            Cookies utilisés sur PILOTE
          </Heading>
          <Text>Deux types de cookies sont déposés :</Text>

          <div className="rounded-lg border border-border bg-surface-tinted p-4">
            <Text as="div" className="space-y-2">
              <span className="block font-semibold text-primary">Cookies techniques :</span>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  Permettent de personnaliser votre utilisation du site (ex. : afficher des cartes
                  ou des réformes spécifiques selon votre profil).
                </li>
                <li>
                  Assurent le bon fonctionnement du chatbot expérimental (ex. : conservation des
                  préférences d&apos;affichage).
                </li>
              </ul>
            </Text>
          </div>

          <div className="rounded-lg border border-border bg-surface-tinted p-4">
            <Text as="div" className="space-y-2">
              <span className="block font-semibold text-primary">
                Cookies de mesure d&apos;audience :
              </span>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  Utilisés pour analyser la fréquentation du site (pages consultées, durée de
                  visite, etc.).
                </li>
                <li>
                  Outil utilisé : <span className="font-semibold">Matomo</span>, configuré pour être
                  conforme à la recommandation &quot;Cookies&quot; de la CNIL (anonymisation des
                  adresses IP).
                </li>
              </ul>
              <span className="block">
                <span className="font-semibold">Désactivation du suivi statistique :</span> Si vous
                ne souhaitez pas être inclus dans les statistiques, activez la fonction &quot;Ne pas
                me pister&quot; (Do Not Track) dans votre navigateur. Matomo respectera ce
                paramètre.
              </span>
            </Text>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <Heading as="h2" size="lg">
          Données personnelles
        </Heading>

        <div className="space-y-3">
          <Heading as="h3" size="md">
            Traitement des données via le site PILOTE
          </Heading>
          <Text>
            Conformément au RGPD et à la loi &quot;Informatique et Libertés&quot; du 6 janvier 1978
            modifiée, vous disposez des droits suivants :
          </Text>
          <ul className="list-disc space-y-1 pl-5">
            <Text as="li">
              <span className="font-semibold">Droit d&apos;accès</span> (article 15 du RGPD) :
              Demander une copie des données vous concernant.
            </Text>
            <Text as="li">
              <span className="font-semibold">Droit de rectification</span> (article 16 du RGPD) :
              Corriger des données inexactes.
            </Text>
            <Text as="li">
              <span className="font-semibold">Droit à la limitation du traitement</span> (article 18
              du RGPD) : Suspendre temporairement l&apos;utilisation de vos données.
            </Text>
            <Text as="li">
              <span className="font-semibold">Droit à l&apos;effacement</span> (article 17 du RGPD)
              : Sous réserve des obligations légales de conservation.
            </Text>
            <Text as="li">
              <span className="font-semibold">Droit d&apos;opposition</span> (article 21 du RGPD) :
              Pour des motifs légitimes, sauf si le traitement est obligatoire pour une mission de
              service public.
            </Text>
          </ul>
          <Text>Pour exercer ces droits, envoyez votre demande :</Text>
          <ul className="list-disc space-y-1 pl-5">
            <Text as="li">
              Par email :{' '}
              <a href="mailto:pilote.ditp@modernisation.gouv.fr" className="text-primary underline">
                pilote.ditp@modernisation.gouv.fr
              </a>
            </Text>
            <Text as="li">Par voie postale (adresse ci-dessus).</Text>
          </ul>
          <Text>En cas de difficulté non résolue, vous pouvez saisir la CNIL.</Text>
        </div>

        <div className="space-y-3">
          <Heading as="h3" size="md">
            Dans le cadre de l&apos;expérimentation Assistant IA PILOTE
          </Heading>

          <Heading as="h4" size="sm" tone="primary">
            Finalités :
          </Heading>
          <Text>Le chatbot est une expérimentation visant à :</Text>
          <ul className="list-disc space-y-1 pl-5">
            <Text as="li">
              Faciliter l&apos;exploitation du tableau de bord par les agents, en leur permettant
              d&apos;interroger les données de manière intuitive, en utilisant des fonctionnalités
              d&apos;intelligence artificielle (modèles de langage).
            </Text>
            <Text as="li">
              Optimiser l&apos;utilisation des indicateurs pour améliorer les résultats de
              l&apos;action publique.
            </Text>
            <Text as="li">
              Recueillir des retours utilisateurs uniquement sur la qualité des réponses du chatbot
              (ex. : pertinence, complétude, exactitude), afin d&apos;ajuster son fonctionnement
              technique.
            </Text>
          </ul>

          <Heading as="h4" size="sm" tone="primary">
            Données collectées :
          </Heading>
          <ul className="list-disc space-y-1 pl-5">
            <Text as="li">
              Prompts (questions posées au chatbot, ex. : &quot;Quels sont les indicateurs clés pour
              le programme X ?&quot;).
            </Text>
            <Text as="li">Réponses générées par l&apos;IA.</Text>
            <Text as="li">
              Feedbacks (👍/👎, catégories de problèmes : hallucination, réponse incomplète, hors
              sujet, problème technique, autre).
            </Text>
            <Text as="li">
              Commentaires libres (facultatifs, strictement limités à l&apos;évaluation des
              réponses).
            </Text>
            <Text as="li">Logs d&apos;utilisation (horodatage, identifiants pseudonymisés).</Text>
          </ul>

          <Text>
            <span className="font-semibold">Base légale :</span> Le traitement repose sur
            l&apos;article 6.1.e du RGPD (mission d&apos;intérêt public), car il contribue à
            améliorer l&apos;efficacité des outils d&apos;analyse des politiques publiques.
          </Text>

          <div className="rounded-lg border border-border bg-surface-tinted p-4">
            <Text as="div" className="space-y-2">
              <span className="block font-semibold text-primary">
                Pseudonymisation et réidentification
              </span>
              <span className="block">
                Vos données sont <span className="font-semibold">pseudonymisées par défaut</span> :
                vos interactions ne sont pas directement associées à votre identité.
              </span>
              <span className="block">
                Une réidentification est possible{' '}
                <span className="font-semibold">
                  uniquement en cas de besoin de support technique
                </span>{' '}
                (ex. : résolution d&apos;un bug, demande explicite de votre part), et uniquement par
                des personnes habilitées.
              </span>
              <span className="block italic">
                Exemple de cas de réidentification : &quot;Si vous signalez une erreur critique dans
                une réponse du chatbot, notre équipe support pourra temporairement accéder à vos
                données pour reproduire et corriger le problème.&quot;
              </span>
            </Text>
          </div>

          <Heading as="h4" size="sm" tone="primary">
            Durées de conservation
          </Heading>
          <ul className="list-disc space-y-1 pl-5">
            <Text as="li">
              Prompts, réponses et retours utilisateurs : Conservés pendant la durée de
              l&apos;expérimentation (1 an), puis supprimés.
            </Text>
            <Text as="li">
              Données nominatives (en cas de réidentification) : Supprimées dès la résolution du
              support (maximum 3 mois).
            </Text>
          </ul>
        </div>

        <div className="space-y-3">
          <Heading as="h3" size="md">
            Vos droits et recommandations
          </Heading>

          <Heading as="h4" size="sm" tone="primary">
            Droits RGPD :
          </Heading>
          <ul className="list-disc space-y-1 pl-5">
            <Text as="li">
              Vous pouvez accéder, rectifier ou supprimer vos données (sous réserve des obligations
              légales).
            </Text>
            <Text as="li">Vous pouvez refuser de fournir un feedback ou un commentaire libre.</Text>
            <Text as="li">
              Pour les commentaires libres, vous pouvez autoriser ou refuser d&apos;être
              recontacté(e) pour approfondir votre retour.
            </Text>
          </ul>

          <Heading as="h4" size="sm" tone="primary">
            Recommandations :
          </Heading>
          <ul className="list-disc space-y-1 pl-5">
            <Text as="li">
              Évitez de saisir des données personnelles (noms, numéros de dossier, etc.) dans les
              prompts ou commentaires.
            </Text>
            <Text as="li">
              Signalez les réponses inappropriées (ex. : erreurs factuelles, hallucinations) via le
              bouton &quot;Signaler un problème&quot; intégré au chatbot.
            </Text>
          </ul>
        </div>

        <div className="space-y-3">
          <Heading as="h3" size="md">
            Exercice de vos droits
          </Heading>
          <Text>
            Pour toute question ou demande relative à vos données traitées via le chatbot, contactez
            :
          </Text>
          <ul className="list-disc space-y-1 pl-5">
            <Text as="li">
              Par email :{' '}
              <a href="mailto:pilote.ditp@modernisation.gouv.fr" className="text-primary underline">
                pilote.ditp@modernisation.gouv.fr
              </a>
            </Text>
            <Text as="li">Par voie postale (adresse ci-dessus).</Text>
          </ul>
        </div>

        <div className="space-y-3">
          <Heading as="h3" size="md">
            Pour toute information complémentaire
          </Heading>
          <Text>
            Pour des demandes plus largement liées à l&apos;application du RGPD, vous pouvez
            contacter :
          </Text>
          <ul className="list-disc space-y-1 pl-5">
            <Text as="li">
              Par email :{' '}
              <a
                href="mailto:contactrgpd.ditp@modernisation.gouv.fr"
                className="text-primary underline"
              >
                contactrgpd.ditp@modernisation.gouv.fr
              </a>
            </Text>
          </ul>
          <Text>
            En cas de difficulté non résolue, vous pouvez contacter la{' '}
            <a
              href="https://www.cnil.fr"
              target="_blank"
              rel="noreferrer"
              className="text-primary underline"
            >
              CNIL
            </a>
            .
          </Text>
        </div>
      </section>
    </div>
  )
}
