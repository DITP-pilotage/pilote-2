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
        <PictoBaromètre />
        : Chantier présent dans le baromètre des résultats de l’action publique
        <PictoTerritorialisé />
        : Chantier dont le pilotage est territorialisé.
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
};

export default INFOBULLE_CONTENUS;
