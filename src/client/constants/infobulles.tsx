import PictoBaromètre from '@/components/_commons/PictoBaromètre/PictoBaromètre';
import PictoTerritorialisé from '@/components/_commons/PictoTerritorialisé/PictoTerritorialisé';
import { IndicateurPondération } from '@/components/PageChantier/PageChantier.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';

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
    alertes: (
      <ul className="fr-text--sm fr-mb-0">
        <li>
          La première alerte signale les chantiers pour lesquels le territoire sélectionné a un recul significatif vis-à-vis du taux d’avancement global national.
        </li>
        <li>
          La seconde alerte signale les chantiers pour lesquels le taux d’avancement a reculé ou n’a pas avancé lors de la dernière mise à jour des données quantitatives.
        </li>
        <li>
          La dernière alerte signale les chantiers pour lesquels la date de mise à jour des données quantitatives est plus récente que celle des données qualitatives (météo, synthèse, commentaire). Les données qualitatives doivent donc être lues avec précaution.
        </li>
      </ul>
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
    avancement: {
      aucunIndicateur: (maille: Maille) => (
        <p className="fr-text--sm">
          {`À la maille ${maille}, `}
          aucun indicateur de ce chantier n’est pris en compte dans le calcul du taux d’avancement global.
        </p>
      ),
      unSeulIndicateur: (maille: Maille, indicateurPondération: IndicateurPondération) => (
        <p className="fr-text--sm">
          {`À la maille ${maille}, `}
          le taux d’avancement global correspond au taux d’avancement 2026 de l’indicateur&nbsp;:
          {` ${indicateurPondération.nom}`}
        </p>
      ),
      plusieursIndicateurs: (maille: Maille, indicateurPondérations: IndicateurPondération[]) => (
        <>
          <p className="fr-text--sm">
            {`À la maille ${maille}, `}
            le taux d’avancement global correspond à la somme des taux d’avancement 2026 des indicateurs, pondérés de la façon suivante&nbsp;:
          </p>
          <ul className="fr-text--sm fr-mb-0">
            {
              indicateurPondérations.map(({ pondération, nom }) => (
                <li key={nom}>
                  {pondération}
                  % du taux d’avancement 2026 de l’indicateur&nbsp;:
                  {` ${nom}`}
                </li>
              ))
            }
          </ul>
        </>
      ),
    },
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
        Décisions prises lors des réunions Elysée ↔ Matignon et suivi des actions prises pour répondre à ces décisions.
      </p>
    ),
    commentaires: {
      territoireNational: (
        <>
          <p className="fr-text--sm">
            Diagnostic du directeur de projet repris pour les supports de présentation des réunions Elysée ↔ Matignon.
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
  projetsStructurants: {
    jauges: (
      <p className="fr-text--sm">
        La moyenne affichée dépend des projets structurants et du territoire sélectionné.
      </p>
    ),
    météos: (
      <>
        <p className="fr-text--sm">
          La météo désigne le niveau de confiance, estimé par le responsable, sur la possibilité d’atteindre les objectifs du projet structurant.
        </p>
        <p className="fr-text--sm">
          Certains projets structurants peuvent ne pas avoir de météo renseignée sur un territoire sélectionné.
        </p>
      </>
    ),
    listeDesProjetsStructurants: (
      <>
        <p className="fr-text--sm">
          La date affichée sous la météo correspond à la date de la dernière modification de la météo, de la synthèse ou d’un commentaire.
        </p>
        <p className="fr-text--sm">
          La date affichée sous le taux d’avancement correspond à la dernière mise à jour des données pour au moins un indicateur du projet structurant.
        </p>
      </>
    ),
  },
  projetStructurant: {
    avancements: (
      <p className="fr-text--sm">
        Le taux d’avancement global correspond à la moyenne des indicateurs.
      </p>
    ),
    météoEtSynthèseDesRésultats: (
      <>
        <p className="fr-text--sm">
          La météo désigne le niveau de confiance, estimé par le responsable, sur la possibilité d’atteindre les objectifs du projet structurant.
        </p>
        <p className="fr-text--sm">
          La synthèse est une présentation synthétique de l’état d’avancement du projet structurant, actualisé depuis la dernière mise à jour des données.
        </p>
      </>
    ),
    objectifs: (
      <p className="fr-text--sm">
        Présentation des objectifs et des principales actions passées et à venir.
      </p>
    ),
    commentaires: (
      <>
        <p className="fr-text--sm">
          Diagnostic du directeur de projet.
        </p>
        <ul className="fr-text--sm fr-mb-0">
          <li>
            Suivi des décisions et réalisations
          </li>
          <li>
            Difficultés rencontrées et risques anticipés
          </li>
          <li>
            Solutions proposées et prochaines étapes
          </li>
          <li>
            Partenariats et moyens mobilisés.
          </li>
        </ul>
      </>
    ),
  },
};

export default INFOBULLE_CONTENUS;
