import { FunctionComponent } from 'react';
import Titre from '@/components/_commons/Titre/Titre';
import IndicateurBloc from '@/components/_commons/IndicateursChantier/Bloc/IndicateurBloc';
import IndicateursChantierStyled from '@/components/_commons/IndicateursChantier/IndicateursChantier.styled';
import { comparerIndicateur } from '@/client/utils/indicateur/indicateur';
import { territoireSélectionnéTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import Alerte from '@/components/_commons/Alerte/Alerte';
import api from '@/server/infrastructure/api/trpc/api';

import { TypeDeRéforme } from '@/client/stores/useTypeDeRéformeStore/useTypedeRéformeStore.interface';
import { ÉlémentPageIndicateursType } from '@/client/utils/rubriques';
import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';

interface IndicateursProps {
  indicateurs: Indicateur[];
  détailsIndicateurs: DétailsIndicateurs
  listeRubriquesIndicateurs: ÉlémentPageIndicateursType[]
  typeDeRéforme: TypeDeRéforme,
  chantierEstTerritorialisé: boolean,
  estInteractif?: boolean
  estAutoriseAVoirLesAlertesMAJIndicateurs?: boolean
  estAutoriseAVoirLesPropositionsDeValeurActuelle?: boolean
}

const IndicateursChantier: FunctionComponent<IndicateursProps> = ({
  indicateurs,
  détailsIndicateurs,
  listeRubriquesIndicateurs,
  typeDeRéforme,
  chantierEstTerritorialisé,
  estInteractif = true,
  estAutoriseAVoirLesAlertesMAJIndicateurs = false,
  estAutoriseAVoirLesPropositionsDeValeurActuelle = false,
}) => {
  const CodeInseeSélectionnée = territoireSélectionnéTerritoiresStore()?.codeInsee;

  const { data: alerteMiseAJourIndicateurEstDisponible } = api.gestionContenu.récupérerVariableContenu.useQuery({ nomVariableContenu: 'NEXT_PUBLIC_FF_ALERTE_MAJ_INDICATEUR' });
  const { data: propositionValeurActuelleEstDisponible } = api.gestionContenu.récupérerVariableContenu.useQuery({ nomVariableContenu: 'NEXT_PUBLIC_FF_PROPOSITION_VALEUR_ACTUELLE' });

  const alerteMiseAJourIndicateur = estAutoriseAVoirLesAlertesMAJIndicateurs && !!alerteMiseAJourIndicateurEstDisponible && Object.values(détailsIndicateurs).flatMap(values => Object.values(values)).reduce((acc, val) => {
    return val.estAJour === false || val.prochaineDateMaj === null && val.dateValeurActuelle !== null && (val.pondération || 0) > 0 ? true : acc;
  }, false);

  if (indicateurs.length === 0) {
    return null;
  }

  return (
    <IndicateursChantierStyled>
      {
        alerteMiseAJourIndicateur ? (
          <div className='fr-mb-2w'>
            <Alerte
              titre='Mise à jour des données requise'
              type='warning'
            />
          </div>
        ) : null
      }
      {
        listeRubriquesIndicateurs.map(rubriqueIndicateur => {
          const indicateursDeCetteRubrique = indicateurs.filter(ind => ind.type === rubriqueIndicateur.typeIndicateur);

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
                        détailsIndicateur={détailsIndicateurs[indicateur.id]}
                        estAutoriseAVoirLesAlertesMAJIndicateurs={estAutoriseAVoirLesAlertesMAJIndicateurs}
                        estAutoriseAVoirLesPropositionsDeValeurActuelle={!!propositionValeurActuelleEstDisponible && estAutoriseAVoirLesPropositionsDeValeurActuelle}
                        estInteractif={estInteractif}
                        indicateur={indicateur}
                        key={indicateur.id}
                        typeDeRéforme={typeDeRéforme}
                      />
                    ))
                }
              </section>
            );
          }
        })
      }
    </IndicateursChantierStyled>
  );
};

export default IndicateursChantier;
