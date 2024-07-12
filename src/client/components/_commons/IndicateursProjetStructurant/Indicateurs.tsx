import { useSession } from 'next-auth/react';
import Titre from '@/components/_commons/Titre/Titre';
import IndicateursProps from '@/components/_commons/IndicateursProjetStructurant/Indicateurs.interface';
import IndicateurBloc from '@/components/_commons/IndicateursProjetStructurant/Bloc/IndicateurBloc';
import IndicateursStyled from '@/components/_commons/IndicateursProjetStructurant/Indicateurs.styled';
import { comparerIndicateur } from '@/client/utils/indicateur/indicateur';
import { territoireSélectionnéTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import Alerte from '@/components/_commons/Alerte/Alerte';
import api from '@/server/infrastructure/api/trpc/api';
import { PROFIL_AUTORISE_A_VOIR_LES_ALERTES_MAJ_INDICATEURS } from './Bloc/useIndicateurAlerteDateMaj';

export default function Indicateurs({
  indicateurs,
  détailsIndicateurs,
  listeRubriquesIndicateurs,
  territoireProjetStructurant,
  typeDeRéforme,
  chantierEstTerritorialisé,
  estInteractif = true,
}: IndicateursProps) {
  const CodeInseeSélectionnée = territoireSélectionnéTerritoiresStore()?.codeInsee;

  const { data: alerteMiseAJourIndicateurEstDisponible } = api.gestionContenu.récupérerVariableContenu.useQuery({ nomVariableContenu: 'NEXT_PUBLIC_FF_ALERTE_MAJ_INDICATEUR' });
  const { data: session } = useSession();

  const estAutoriseAVoirLesAlertesMAJIndicateurs = PROFIL_AUTORISE_A_VOIR_LES_ALERTES_MAJ_INDICATEURS.has(session!.profil);

  const alerteMiseAJourIndicateur = estAutoriseAVoirLesAlertesMAJIndicateurs && !!alerteMiseAJourIndicateurEstDisponible && Object.values(détailsIndicateurs).flatMap(values => Object.values(values)).reduce((acc, val) => {
    return val.estAJour === false || val.prochaineDateMaj === null && val.dateValeurActuelle !== null && (val.pondération || 0) > 0 ? true : acc;
  }, false);

  if (indicateurs.length === 0) {
    return null;
  }

  const listeIndicateursParent = indicateurs.filter(indicateur => !indicateur.parentId);

  return (
    <IndicateursStyled>
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
                        listeSousIndicateurs={indicateurs.filter(ind => ind.parentId === indicateur.id)}
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
