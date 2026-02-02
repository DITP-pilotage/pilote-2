import { FunctionComponent } from "react";
import Link from "next/link";
import Titre from "@/client/components/_commons/Titre/Titre";
import Bloc from "@/components/_commons/Bloc/Bloc";

const Accessibilite: FunctionComponent = () => {
  return (
    <main>
      <div className="fr-container fr-pb-2w">
        <div className="fr-grid-row fr-py-4w">
          <Titre baliseHtml="h1" className="fr-my-auto">
            Accessibilité
          </Titre>
        </div>
        <Bloc>
          <div className="fr-grid-row">
            <div className="fr-col-12">
              <h4 className="fr-h4">Déclaration d'accessibilité</h4>
              <p>
                La Direction interministérielle de la transformation publique
                s'engage à rendre son service accessible, conformément à
                l'article 47 de la loi n° 2005-102 du 11 février 2005.
              </p>
              <p>
                À cette fin, nous mettons en œuvre la stratégie et les actions
                suivantes :
                <br />
                <Link
                  href="https://www.modernisation.gouv.fr/files/2022-10/schema-pluriannuel-2022-2025-ditp.pdf"
                  title="Schéma pluriannuel d'accessibilité 2022-2025"
                >
                  https://www.modernisation.gouv.fr/files/2022-10/schema-pluriannuel-2022-2025-ditp.pdf
                </Link>
              </p>
              <p>
                Cette déclaration d'accessibilité s'applique à PILOTE
                (pilote.ditp@modernisation.gouv.fr).
              </p>
            </div>
          </div>
          <div className="fr-grid-row">
            <div className="fr-col-12">
              <h4 className="fr-h4">Etat de conformité</h4>
              <p>
                PILOTE est non conforme avec le RGAA. Le site n'a pas encore été
                audité.
              </p>
            </div>
          </div>
          <div className="fr-grid-row">
            <div className="fr-col-12">
              <h4 className="fr-h4">Amélioration et contact</h4>
              <p>
                Si vous n'arrivez pas à accéder à un contenu ou à un service,
                vous pouvez contacter l'équipe de PILOTE pour être orienté vers
                une alternative accessible ou obtenir le contenu sous une autre
                forme.
              </p>
              <ul>
                <li>E-mail: pilote.ditp@modernisation.gouv.fr</li>
                <li>Adresse : DITP, 20 avenue de Ségur, 75007 Paris France</li>
              </ul>
              <p>
                Nous essayons de répondre dans les 5 jours ouvrés suivant la
                demande.
              </p>
            </div>
          </div>
          <div className="fr-grid-row">
            <div className="fr-col-12">
              <h4 className="fr-h4">Voie de recours</h4>
              <p>
                Cette procédure est à utiliser dans le cas suivant : vous avez
                signalé au responsable du site internet un défaut
                d'accessibilité qui vous empêche d'accéder à un contenu ou à un
                des services du portail et vous n'avez pas obtenu de réponse
                satisfaisante.
              </p>
              <p className="fr-mb-0">Vous pouvez :</p>
              <ul>
                <li>
                  Écrire un message au{" "}
                  <Link
                    href="https://formulaire.defenseurdesdroits.fr/formulaire_saisine/"
                    title="Écrire un message au défenseur des droits"
                  >
                    Défenseur des droits
                  </Link>
                </li>
                <li>
                  Contacter{" "}
                  <Link
                    href="https://www.defenseurdesdroits.fr/carte-des-delegues"
                    title="Contacter le délégué du Défenseur des droits dans votre région"
                  >
                    le délégué du Défenseur des droits dans votre région
                  </Link>
                </li>
                <li>
                  Envoyer un courrier par la poste (gratuit, ne pas mettre de
                  timbre) : Défenseur des droitsLibre réponse 71120 75342 Paris
                  CEDEX 07
                </li>
              </ul>
              <p>
                Cette déclaration d'accessibilité a été créé le 28 juillet 2023
                grâce au{" "}
                <Link
                  href="https://betagouv.github.io/a11y-generateur-declaration/#create"
                  title="Générateur de Déclaration d'Accessibilité de BetaGouv"
                >
                  Générateur de Déclaration d'Accessibilité de BetaGouv.
                </Link>
              </p>
            </div>
          </div>
        </Bloc>
      </div>
    </main>
  );
};

export default Accessibilite;
