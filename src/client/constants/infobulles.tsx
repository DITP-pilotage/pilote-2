import PictoBaromètre from '@/components/_commons/PictoBaromètre/PictoBaromètre';
import PictoTerritorialisé from '@/components/_commons/PictoTerritorialisé/PictoTerritorialisé';

const INFOBULLE_CONTENUS = {
  chantiers: {
    jauges: (
      <>
        <p className="fr-text--sm">
          La moyenne affichée dépend des chantiers et du territoire sélectionné.
        </p>
        <p className="fr-text--sm">
          Le minimum, la médiane et le maximum dépendent des chantiers et de la maille sélectionnée (région ou département).
        </p>
        <p className="fr-text--sm">
          La moyenne d’une maille supérieure (nationale ou régionale) ne correspond pas nécessairement à la moyenne des territoires des mailles inférieures parce que certains indicateurs qui entrent en compte dans le calcul du taux d’avancement sont spécifiques à une maille.
        </p>
      </>
    ),
    météos: (
      <>
        <p className="fr-text--sm">
          La météo désigne le niveau de confiance, estimé par le responsable, sur la possibilité d’atteindre les objectifs du chantier.
        </p>
        <p className="fr-text--sm">
          Certains chantiers peuvent ne pas avoir de météo renseignée sur un territoire sélectionné. Les chantiers non territorialisés n’attendent pas de météo pour le niveau local.
        </p>
      </>
    ),
    listeDesChantiers: (
      <>
        <p className="fr-text--sm">
          <PictoBaromètre />
          {' '}
          : Chantier présent dans le baromètre des résultats de l’action publique
        </p>
        <p className="fr-text--sm">
          <PictoTerritorialisé />
          {' '}
          : Chantier dont le pilotage est territorialisé.
        </p>
        <p className="fr-text--sm">
          La date affichée sous la météo correspond à la date de la dernière modification de la météo, de la synthèse ou d’un commentaire.
        </p>
        <p className="fr-text--sm">
          La date affichée sous le taux d’avancement correspond à la dernière mise à jour des données pour au moins un indicateur du chantier.
        </p>
        <p className="fr-text--sm">
          La tendance correspond à la progression du taux d’avancement.
        </p>
        <p className="fr-text--sm">
          L’écart correspond à l’écart entre le taux d’avancement pour le territoire sélectionné et le taux d’avancement national.
        </p>
      </>
    ),
  },
  chantier: {
    météoEtSynthèseDesRésultats: (
      <>
        <p className="fr-text--sm">
          La météo désigne le niveau de confiance, estimé par le responsable, sur la possibilité d’atteindre les objectifs du chantier.
        </p>
        <p className="fr-text--sm">
          La synthèse est une présentation synthétique de l’état d’avancement du chantier, actualisé depuis la dernière mise à jour des données.
        </p>
      </>
    ),
    répartitionGéographiqueTauxAvancement: (
      <p className="fr-text--sm">
        Territorialisation du taux d’avancement du chantier 
      </p>
    ),
    répartitionGéographiqueNiveauDeConfiance: (
      <p className="fr-text--sm">
        Répartition de la météo déclarée par chaque responsable local pour l’avancement de son chantier dans son territoire.
      </p>
    ),
    objectifs: (
      <p className="fr-text--sm">
        Présentation des objectifs et des principales actions passées et à venir au niveau national. Si le chantier est territorialisé, ces éléments seront visibles par les services déconcentrés et doivent les aider à comprendre le chantier et à le faire avancer localement.
      </p>
    ),
    décisionsStratégiques: (
      <p className="fr-text--sm">
        Décisions prises lors des réunions Elysée ↔ Matignon (AKAR) et suivi des actions prises pour répondre à ces décisions. 
      </p>
    ),
    commentaires: {
      territoireNational: (
        <>
          <p className="fr-text--sm">
            Diagnostic du directeur de projet repris pour les supports de présentation des réunions Elysée ↔ Matignon (AKAR).
          </p>
          <ul className="fr-text--sm fr-mb-0">
            <li>
              Explication des résultats chiffrés
            </li>
            <li>
              Analyse des résultats qui ne transparaissent pas dans les données
            </li>
            <li>
              Analyse des freins et solutions envisagées
            </li>
            <li>
              Exemples de réussites pouvant être communiqués plus largement.
            </li>
          </ul>
        </>
      ),
      territoireNonNational: (
        <>
          <p className="fr-text--sm">
            Diagnostic du responsable local du chantier repris pour préparer les RIM régionales.
          </p>
          <ul className="fr-text--sm fr-mb-0">
            <li>
              Explication des résultats chiffrés
            </li>
            <li>
              Présentation des résultats qui ne transparaissent pas dans les données.
            </li>
          </ul>
        </>
      ),
    },
  },
};

export default INFOBULLE_CONTENUS;
