import Titre from '@/components/_commons/Titre/Titre';
import IndicateursProps from '@/components/_commons/Indicateurs/Indicateurs.interface';
import IndicateurBloc from '@/components/_commons/Indicateurs/Bloc/IndicateurBloc';
import IndicateursStyled from '@/components/_commons/Indicateurs/Indicateurs.styled';
import { comparerIndicateur } from '@/client/utils/indicateur/indicateur';
import { territoireSélectionnéTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import Alerte from '@/components/_commons/Alerte/Alerte';
import api from '@/server/infrastructure/api/trpc/api';

export default function Indicateurs({
  indicateurs,
  détailsIndicateurs,
  listeRubriquesIndicateurs,
  territoireProjetStructurant,
  typeDeRéforme,
  chantierEstTerritorialisé,
  estDisponibleALImport = false,
  estInteractif = true,
  estAutoriseAVoirLesAlertesMAJIndicateurs = false,
}: IndicateursProps) {
  const CodeInseeSélectionnée = territoireSélectionnéTerritoiresStore()?.codeInsee;

  const { data: alerteMiseAJourIndicateurEstDisponible } = api.gestionContenu.récupérerVariableContenu.useQuery({ nomVariableContenu: 'NEXT_PUBLIC_FF_ALERTE_MAJ_INDICATEUR' });

  const alerteMiseAJourIndicateur = estAutoriseAVoirLesAlertesMAJIndicateurs && !!alerteMiseAJourIndicateurEstDisponible && Object.values(détailsIndicateurs).flatMap(values => Object.values(values)).reduce((acc, val) => {
    return val.estAJour === false || val.prochaineDateMaj === null && val.dateValeurActuelle !== null ? true : acc;
  }, false);

  if (indicateurs.length === 0) {
    return null;
  }

  return (
    <IndicateursStyled>
      {
        alerteMiseAJourIndicateur ? (
          <div className='fr-mb-2w'>
            <Alerte
              titre='Mise à jour des données requises'
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
                        estDisponibleALImport={estDisponibleALImport}
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
    </IndicateursStyled>
  );
}
