import Link from "next/link";
import { FunctionComponent } from "react";
import { Callout } from "@/components/shared/Callout";

const linkClassName = "text-primary";

const DonneesPersonnellesCookies: FunctionComponent = () => {
  return (
    <main>
      <div className="max-w-screen-lg mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-primary mb-6">
          Données personnelles et cookies
        </h1>

        <article className="bg-white border border-dsfr-grey-925 rounded-lg p-6 space-y-10">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-primary">
              Responsable de traitement
            </h2>
            <p>
              La Direction interministérielle de la transformation publique
              (mission Pilotage), située au 20 avenue de Ségur, 75007 Paris, est
              responsable du traitement des données personnelles pour le site
              PILOTE et ses fonctionnalités, y compris le chatbot expérimental.
            </p>
            <p>
              Pour toute question relative à la protection des données, vous
              pouvez contacter :
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Par email :{" "}
                <Link
                  className={linkClassName}
                  href="mailto:contactrgpd.ditp@modernisation.gouv.fr"
                >
                  contactrgpd.ditp@modernisation.gouv.fr
                </Link>
              </li>
              <li>
                Par voie postale : Direction interministérielle de la
                transformation publique TSA 70732 75334 Paris Cedex 07
              </li>
            </ul>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-primary">Cookies</h2>

            <div className="space-y-3">
              <h3 className="text-xl font-bold text-primary">
                Informations sur les cookies
              </h3>
              <p>
                Lors de la consultation de notre site{" "}
                <Link
                  className={linkClassName}
                  href="https://pilote.modernisation.gouv.fr"
                >
                  https://pilote.modernisation.gouv.fr
                </Link>
                , des cookies sont déposés sur votre ordinateur, mobile ou
                tablette.
              </p>
              <p>
                <span className="font-semibold">
                  Définition d&apos;un cookie :
                </span>{" "}
                Un cookie est un fichier texte déposé sur votre terminal lors de
                la visite d&apos;un site. Il permet de collecter des
                informations relatives à votre navigation et de vous proposer
                des services adaptés.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-bold text-primary">
                Cookies utilisés sur PILOTE
              </h3>
              <p>Deux types de cookies sont déposés :</p>

              <Callout.Root color="neutral">
                <div className="space-y-2 flex-1">
                  <h4 className="text-base font-semibold text-primary">
                    Cookies techniques :
                  </h4>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>
                      Permettent de personnaliser votre utilisation du site (ex.
                      : afficher des cartes ou des réformes spécifiques selon
                      votre profil).
                    </li>
                    <li>
                      Assurent le bon fonctionnement du chatbot expérimental
                      (ex. : conservation des préférences d&apos;affichage).
                    </li>
                  </ul>
                </div>
              </Callout.Root>

              <Callout.Root color="neutral">
                <div className="space-y-2 flex-1">
                  <h4 className="text-base font-semibold text-primary">
                    Cookies de mesure d&apos;audience :
                  </h4>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>
                      Utilisés pour analyser la fréquentation du site (pages
                      consultées, durée de visite, etc.).
                    </li>
                    <li>
                      Outil utilisé :{" "}
                      <span className="font-semibold">Matomo</span>, configuré
                      pour être conforme à la recommandation &quot;Cookies&quot;
                      de la CNIL (anonymisation des adresses IP).
                    </li>
                  </ul>
                  <p>
                    <span className="font-semibold">
                      Désactivation du suivi statistique :
                    </span>{" "}
                    Si vous ne souhaitez pas être inclus dans les statistiques,
                    activez la fonction &quot;Ne pas me pister&quot; (Do Not
                    Track) dans votre navigateur. Matomo respectera ce
                    paramètre.
                  </p>
                </div>
              </Callout.Root>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-primary">
              Données personnelles
            </h2>

            <div className="space-y-3">
              <h3 className="text-xl font-bold text-primary">
                Traitement des données via le site PILOTE
              </h3>
              <p>
                Conformément au RGPD et à la loi &quot;Informatique et
                Libertés&quot; du 6 janvier 1978 modifiée, vous disposez des
                droits suivants :
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  <span className="font-semibold">Droit d&apos;accès</span>{" "}
                  (article 15 du RGPD) : Demander une copie des données vous
                  concernant.
                </li>
                <li>
                  <span className="font-semibold">Droit de rectification</span>{" "}
                  (article 16 du RGPD) : Corriger des données inexactes.
                </li>
                <li>
                  <span className="font-semibold">
                    Droit à la limitation du traitement
                  </span>{" "}
                  (article 18 du RGPD) : Suspendre temporairement
                  l&apos;utilisation de vos données.
                </li>
                <li>
                  <span className="font-semibold">
                    Droit à l&apos;effacement
                  </span>{" "}
                  (article 17 du RGPD) : Sous réserve des obligations légales de
                  conservation.
                </li>
                <li>
                  <span className="font-semibold">Droit d&apos;opposition</span>{" "}
                  (article 21 du RGPD) : Pour des motifs légitimes, sauf si le
                  traitement est obligatoire pour une mission de service public.
                </li>
              </ul>
              <p>Pour exercer ces droits, envoyez votre demande :</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  Par email :{" "}
                  <Link
                    className={linkClassName}
                    href="mailto:pilote.ditp@modernisation.gouv.fr"
                  >
                    pilote.ditp@modernisation.gouv.fr
                  </Link>
                </li>
                <li>Par voie postale (adresse ci-dessus).</li>
              </ul>
              <p>
                En cas de difficulté non résolue, vous pouvez saisir la CNIL.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-bold text-primary">
                Dans le cadre de l&apos;expérimentation Assistant IA PILOTE
              </h3>

              <h4 className="text-base font-semibold text-primary">
                Finalités :
              </h4>
              <p>Le chatbot est une expérimentation visant à :</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  Faciliter l&apos;exploitation du tableau de bord par les
                  agents, en leur permettant d&apos;interroger les données de
                  manière intuitive, en utilisant des fonctionnalités
                  d&apos;intelligence artificielle (modèles de langage).
                </li>
                <li>
                  Optimiser l&apos;utilisation des indicateurs pour améliorer
                  les résultats de l&apos;action publique.
                </li>
                <li>
                  Recueillir des retours utilisateurs uniquement sur la qualité
                  des réponses du chatbot (ex. : pertinence, complétude,
                  exactitude), afin d&apos;ajuster son fonctionnement technique.
                </li>
              </ul>

              <h4 className="text-base font-semibold text-primary">
                Données collectées :
              </h4>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  Prompts (questions posées au chatbot, ex. : &quot;Quels sont
                  les indicateurs clés pour le programme X ?&quot;).
                </li>
                <li>Réponses générées par l&apos;IA.</li>
                <li>
                  Feedbacks (👍/👎, catégories de problèmes : hallucination,
                  réponse incomplète, hors sujet, problème technique, autre).
                </li>
                <li>
                  Commentaires libres (facultatifs, strictement limités à
                  l&apos;évaluation des réponses).
                </li>
                <li>
                  Logs d&apos;utilisation (horodatage, identifiants
                  pseudonymisés).
                </li>
              </ul>

              <p>
                <span className="font-semibold">Base légale :</span> Le
                traitement repose sur l&apos;article 6.1.e du RGPD (mission
                d&apos;intérêt public), car il contribue à améliorer
                l&apos;efficacité des outils d&apos;analyse des politiques
                publiques.
              </p>

              <Callout.Root color="info">
                <div className="space-y-2 flex-1">
                  <h4 className="text-base font-semibold text-primary">
                    Pseudonymisation et réidentification
                  </h4>
                  <p>
                    Vos données sont{" "}
                    <span className="font-semibold">
                      pseudonymisées par défaut
                    </span>{" "}
                    : vos interactions ne sont pas directement associées à votre
                    identité.
                  </p>
                  <p>
                    Une réidentification est possible{" "}
                    <span className="font-semibold">
                      uniquement en cas de besoin de support technique
                    </span>{" "}
                    (ex. : résolution d&apos;un bug, demande explicite de votre
                    part), et uniquement par des personnes habilitées.
                  </p>
                  <p className="italic">
                    Exemple de cas de réidentification : &quot;Si vous signalez
                    une erreur critique dans une réponse du chatbot, notre
                    équipe support pourra temporairement accéder à vos données
                    pour reproduire et corriger le problème.&quot;
                  </p>
                </div>
              </Callout.Root>

              <h4 className="text-base font-semibold text-primary">
                Durées de conservation
              </h4>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  Prompts, réponses et retours utilisateurs : Conservés pendant
                  la durée de l&apos;expérimentation (1 an), puis supprimés.
                </li>
                <li>
                  Données nominatives (en cas de réidentification) : Supprimées
                  dès la résolution du support (maximum 3 mois).
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-bold text-primary">
                Vos droits et recommandations
              </h3>

              <h4 className="text-base font-semibold text-primary">
                Droits RGPD :
              </h4>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  Vous pouvez accéder, rectifier ou supprimer vos données (sous
                  réserve des obligations légales).
                </li>
                <li>
                  Vous pouvez refuser de fournir un feedback ou un commentaire
                  libre.
                </li>
                <li>
                  Pour les commentaires libres, vous pouvez autoriser ou refuser
                  d&apos;être recontacté(e) pour approfondir votre retour.
                </li>
              </ul>

              <h4 className="text-base font-semibold text-primary">
                Recommandations :
              </h4>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  Évitez de saisir des données personnelles (noms, numéros de
                  dossier, etc.) dans les prompts ou commentaires.
                </li>
                <li>
                  Signalez les réponses inappropriées (ex. : erreurs factuelles,
                  hallucinations) via le bouton &quot;Signaler un problème&quot;
                  intégré au chatbot.
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-bold text-primary">
                Exercice de vos droits
              </h3>
              <p>
                Pour toute question ou demande relative à vos données traitées
                via le chatbot, contactez :
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  Par email :{" "}
                  <Link
                    className={linkClassName}
                    href="mailto:pilote.ditp@modernisation.gouv.fr"
                  >
                    pilote.ditp@modernisation.gouv.fr
                  </Link>
                </li>
                <li>Par voie postale (adresse ci-dessus).</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-bold text-primary">
                Pour toute information complémentaire
              </h3>
              <p>
                Pour des demandes plus largement liées à l&apos;application du
                RGPD, vous pouvez contacter :
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  Par email :{" "}
                  <Link
                    className={linkClassName}
                    href="mailto:contactrgpd.ditp@modernisation.gouv.fr"
                  >
                    contactrgpd.ditp@modernisation.gouv.fr
                  </Link>
                </li>
              </ul>
              <p>
                En cas de difficulté non résolue, vous pouvez contacter la{" "}
                <Link className={linkClassName} href="https://www.cnil.fr">
                  CNIL
                </Link>
                .
              </p>
            </div>
          </section>
        </article>
      </div>
    </main>
  );
};

export default DonneesPersonnellesCookies;
