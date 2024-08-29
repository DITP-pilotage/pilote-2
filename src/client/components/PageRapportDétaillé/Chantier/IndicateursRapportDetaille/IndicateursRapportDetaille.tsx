import Titre from '@/components/_commons/Titre/Titre';
import IndicateursProps from '@/components/PageRapportDétaillé/Chantier/IndicateursRapportDetaille/Indicateurs.interface';
import IndicateurBloc from '@/components/PageRapportDétaillé/Chantier/IndicateursRapportDetaille/Bloc/IndicateurBloc';
import IndicateursStyled from '@/components/PageRapportDétaillé/Chantier/IndicateursRapportDetaille/Indicateurs.styled';
import { comparerIndicateur } from '@/client/utils/indicateur/indicateur';
import api from '@/server/infrastructure/api/trpc/api';

export default function IndicateursRapportDetaille({
  territoireCode,
  indicateurs,
  détailsIndicateurs,
  listeRubriquesIndicateurs,
  territoireProjetStructurant,
  typeDeRéforme,
}: IndicateursProps) {
  const codeInseeSélectionnée = territoireCode?.split('-')[1];
  if (indicateurs.length === 0) {
    return null;
  }

  const { data: sousIndicateursDisponibles } = api.gestionContenu.récupérerVariableContenu.useQuery({ nomVariableContenu: 'NEXT_PUBLIC_FF_SOUS_INDICATEURS' });
  const listeIndicateursParent = !!sousIndicateursDisponibles ? 
    indicateurs.filter(indicateur => !indicateur.parentId) :
    indicateurs;
  
  return (
    <IndicateursStyled>
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
                  !!codeInseeSélectionnée && indicateursDeCetteRubrique
                    .sort((a, b) => comparerIndicateur(a, b, détailsIndicateurs[a.id][codeInseeSélectionnée]?.pondération, détailsIndicateurs[b.id][codeInseeSélectionnée]?.pondération))
                    .map(indicateur => {
                      const listeSousIndicateurs = !!sousIndicateursDisponibles ? 
                        indicateurs.filter(ind => ind.parentId === indicateur.id) :
                        [];                      
                      return (
                        <IndicateurBloc
                          détailsIndicateurs={détailsIndicateurs}
                          indicateur={indicateur}
                          key={indicateur.id}
                          listeSousIndicateurs={listeSousIndicateurs}
                          territoireCode={territoireCode}
                          territoireProjetStructurant={territoireProjetStructurant}
                          typeDeRéforme={typeDeRéforme}
                        />
                      );
                    })
                }
              </section>
            );
          }
        })
      }
    </IndicateursStyled>
  );
}
