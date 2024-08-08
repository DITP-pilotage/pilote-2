import { FunctionComponent } from 'react';
import Titre from '@/components/_commons/Titre/Titre';
import IndicateurBloc from '@/components/_commons/IndicateursProjetStructurant/Bloc/IndicateurBloc';
import IndicateursProjetStructurantStyled
  from '@/components/_commons/IndicateursProjetStructurant/IndicateursProjetStructurant.styled';
import { comparerIndicateur } from '@/client/utils/indicateur/indicateur';
import { territoireSélectionnéTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import { TypeDeRéforme } from '@/client/stores/useTypeDeRéformeStore/useTypedeRéformeStore.interface';
import { ÉlémentPageIndicateursType } from '@/client/utils/rubriques';
import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';

interface RubriquesIndicateursProps {
  indicateurs: Indicateur[];
  détailsIndicateurs: DétailsIndicateurs
  listeRubriquesIndicateurs: ÉlémentPageIndicateursType[]
  typeDeRéforme: TypeDeRéforme,
  chantierEstTerritorialisé: boolean,
  territoireProjetStructurant?: ProjetStructurant['territoire']
  estInteractif?: boolean
}

const IndicateursProjetStructurant: FunctionComponent<RubriquesIndicateursProps> = ({
  indicateurs,
  détailsIndicateurs,
  listeRubriquesIndicateurs,
  territoireProjetStructurant,
  typeDeRéforme,
  chantierEstTerritorialisé,
  estInteractif = true,
}) => {
  const CodeInseeSélectionnée = territoireSélectionnéTerritoiresStore()?.codeInsee;

  if (indicateurs.length === 0) {
    return null;
  }

  const listeIndicateursParent = indicateurs.filter(indicateur => !indicateur.parentId);

  return (
    <IndicateursProjetStructurantStyled>
      {
        listeRubriquesIndicateurs.map(rubriqueIndicateur => {
          const indicateursDeCetteRubrique = listeIndicateursParent.filter(ind => ind.type === rubriqueIndicateur.typeIndicateur);

          if (indicateursDeCetteRubrique.length > 0) {
            return (
              <section
                className='fr-mb-3w sous-rubrique-indicateur'
                id={rubriqueIndicateur.ancre}
                key={rubriqueIndicateur.ancre}
              >
                <Titre
                  baliseHtml='h3'
                  className='fr-text--lg fr-mb-1w fr-mx-2w fr-mx-md-0'
                >
                  {rubriqueIndicateur.nom}
                </Titre>
                {
                  !!CodeInseeSélectionnée && indicateursDeCetteRubrique
                    .sort((a, b) => comparerIndicateur(a, b, détailsIndicateurs[a.id][CodeInseeSélectionnée]?.pondération, détailsIndicateurs[b.id][CodeInseeSélectionnée]?.pondération))
                    .map(indicateur => (
                      <IndicateurBloc
                        chantierEstTerritorialisé={chantierEstTerritorialisé}
                        détailsIndicateurs={détailsIndicateurs}
                        estInteractif={estInteractif}
                        indicateur={indicateur}
                        key={indicateur.id}
                        territoireProjetStructurant={territoireProjetStructurant}
                        typeDeRéforme={typeDeRéforme}
                      />
                    ))
                }
              </section>
            );
          }
        })
      }
    </IndicateursProjetStructurantStyled>
  );
};

export default IndicateursProjetStructurant;
