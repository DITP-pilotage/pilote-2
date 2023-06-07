import IndicateurBlocCaractéristiquesProps from '@/components/PageChantier/Indicateurs/Bloc/IndicateurBlocCaractéristiques/IndicateurBlocCaractéristiques.interface';

export function IndicateurBlocCaractéristiques({ indicateurPondération, mailleSélectionnée }: IndicateurBlocCaractéristiquesProps) {
  return (
    <>
      <p className="fr-mb-0 fr-text--xs texte-gris">
        Dernière mise à jour :
        {' '}
        <span className="fr-text--bold">
          Non renseigné
        </span>
      </p>
      <p className="fr-mb-3w fr-text--xs texte-gris">
        {
          indicateurPondération[mailleSélectionnée] === null
            ? "La pondération n'est pas disponible."
            : (
              indicateurPondération[mailleSélectionnée] === 0
                ? 'Cet indicateur n’est pas pris en compte dans le taux d’avancement du chantier.'
                : (
                  <>
                    Cet indicateur représente
                    {' '}
                    <span className="fr-text--bold">
                      {indicateurPondération[mailleSélectionnée]?.toFixed(0)}
                      %
                    </span>
                    {' '}
                    du taux d’avancement du chantier.
                  </>
                )
            )
          }
      </p>
    </>
  );
}
