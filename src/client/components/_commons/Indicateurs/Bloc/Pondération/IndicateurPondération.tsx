import IndicateurPondérationProps from '@/components/_commons/Indicateurs/Bloc/Pondération/IndicateurPondération.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';

const adjectifÀPartirDeLaMaille: Record<Maille, string> = {
  nationale: 'national',
  régionale: 'régional',
  départementale: 'départemental',
};

export function IndicateurPondération({ indicateurPondération, mailleSélectionnée }: IndicateurPondérationProps) {
  return (
    <p className="fr-text--xs texte-gris">
      {
          indicateurPondération[mailleSélectionnée] === null
            ? `La pondération n'est pas disponible pour le taux d'avancement ${adjectifÀPartirDeLaMaille[mailleSélectionnée]}.`
            : (
              indicateurPondération[mailleSélectionnée] === 0
                ? `Cet indicateur n’est pas pris en compte dans le taux d’avancement ${adjectifÀPartirDeLaMaille[mailleSélectionnée]} du chantier.`
                : (
                  <>
                    Cet indicateur représente
                    {' '}
                    <span className="fr-text--bold">
                      {indicateurPondération[mailleSélectionnée]?.toFixed(0)}
                      %
                    </span>
                    {' '}
                    du taux d’avancement 
                    {' '}
                    { adjectifÀPartirDeLaMaille[mailleSélectionnée] }
                    {' '}
                    du chantier.
                  </>
                )
            )
          }
    </p>
  );
}
