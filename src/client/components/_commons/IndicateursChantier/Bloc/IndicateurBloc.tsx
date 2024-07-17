import { Fragment, FunctionComponent } from 'react';
import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import PictoBaromètre from '@/components/_commons/PictoBaromètre/PictoBaromètre';
import IndicateurDétails from '@/components/_commons/IndicateursChantier/Bloc/Détails/IndicateurDétails';
import {
  territoiresComparésTerritoiresStore,
  territoireSélectionnéTerritoiresStore,
} from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import {
  IndicateurPonderation,
} from '@/components/_commons/IndicateursChantier/Bloc/Pondération/IndicateurPonderation';
import BadgeIcône from '@/components/_commons/BadgeIcône/BadgeIcône';
import api from '@/server/infrastructure/api/trpc/api';
import '@gouvfr/dsfr/dist/component/table/table.min.css';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { DétailsIndicateurTerritoire } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import { TypeDeRéforme } from '@/stores/useTypeDeRéformeStore/useTypedeRéformeStore.interface';
import { estLargeurDÉcranActuelleMoinsLargeQue } from '@/stores/useLargeurDÉcranStore/useLargeurDÉcranStore';
import ValeurEtDate from '@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/ValeurEtDate';
import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import IndicateurBlocIndicateurTuile
  from '@/components/_commons/IndicateursChantier/Bloc/indicateurBlocIndicateurTuile';
import ModalePropositonValeurActuelle
  from '@/components/_commons/IndicateursChantier/Bloc/ModalePropositonValeurActuelle/ModalePropositonValeurActuelle';
import IndicateurBlocStyled from './IndicateurBloc.styled';
import useIndicateurBloc from './useIndicateurBloc';

export const ID_HTML_MODALE_PROPOSITION_VALEUR_ACTUELLE = 'modale-proposition-valeur-actuelle';

interface IndicateurBlocProps {
  indicateur: Indicateur
  détailsIndicateur: DétailsIndicateurTerritoire
  estInteractif: boolean
  typeDeRéforme: TypeDeRéforme,
  chantierEstTerritorialisé: boolean,
  estAutoriseAVoirLesAlertesMAJIndicateurs: boolean,
  estAutoriseAVoirLesPropositionsDeValeurActuelle: boolean,
}

const IndicateurBloc: FunctionComponent<IndicateurBlocProps> = ({
  indicateur,
  détailsIndicateur,
  estInteractif,
  typeDeRéforme,
  chantierEstTerritorialisé,
  estAutoriseAVoirLesAlertesMAJIndicateurs = false,
  estAutoriseAVoirLesPropositionsDeValeurActuelle = false,
}) => {
  const estVueTuile = estLargeurDÉcranActuelleMoinsLargeQue('sm');
  const territoiresComparés = territoiresComparésTerritoiresStore();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();

  const {
    dateDeMiseAJourIndicateur,
    dateProchaineDateMaj,
  } = useIndicateurBloc(détailsIndicateur, territoireSélectionné);

  const informationsIndicateurs = (
    territoiresComparés.map(territoireCompare => ({
      territoireNom: territoireCompare.nomAffiché,
      données: détailsIndicateur[territoireCompare.codeInsee],
    }) || [{
      territoireNom: territoireSélectionné!.nomAffiché,
      données: détailsIndicateur[territoireSélectionné!.codeInsee],
    }]).sort((indicateurDétailsTerritoire1, indicateurDétailsTerritoire2) => indicateurDétailsTerritoire1.données.codeInsee.localeCompare(indicateurDétailsTerritoire2.données.codeInsee))
  );

  const { data: alerteMiseAJourIndicateurEstDisponible } = api.gestionContenu.récupérerVariableContenu.useQuery({ nomVariableContenu: 'NEXT_PUBLIC_FF_ALERTE_MAJ_INDICATEUR' });

  const estIndicateurEnAlerte = estAutoriseAVoirLesAlertesMAJIndicateurs && !!alerteMiseAJourIndicateurEstDisponible && détailsIndicateur[territoireSélectionné!.codeInsee]?.estAJour === false && détailsIndicateur[territoireSélectionné!.codeInsee]?.prochaineDateMaj !== null;

  return (
    <IndicateurBlocStyled
      className='fr-mb-2w'
      key={indicateur.id}
    >
      <Bloc>
        <section>
          <div className='flex justify-between'>
            <div>
              <Titre
                baliseHtml='h4'
                className='fr-text--xl fr-mb-1w'
              >

                {
                  estIndicateurEnAlerte ? (
                    <span className='fr-mr-1v'>
                      <BadgeIcône type='warning' />
                    </span>
                  ) : null
                }
                {
                  indicateur.estIndicateurDuBaromètre ? (
                    <span className='fr-mr-1v'>
                      <PictoBaromètre />
                    </span>
                  )
                    : null
                }
                {indicateur.nom + (indicateur.unité === null || indicateur.unité === '' ? '' : ` (en ${indicateur.unité?.toLocaleLowerCase()})`)}
              </Titre>
              <div className='fr-ml-2w fr-mb-3w'>
                {
                  !!territoireSélectionné && !!détailsIndicateur[territoireSélectionné.codeInsee] ? (
                    <p className='fr-mb-0 fr-text--xs texte-gris'>
                      Identifiant de l'indicateur :
                      {' '}
                      <strong>
                        {indicateur.id}
                      </strong>
                    </p>
                  ) : null
                }
                <p className='fr-mb-0 fr-text--xs texte-gris'>
                  Dernière mise à jour des données (de l'indicateur) :
                  {' '}
                  <span className='fr-text--bold'>
                    {dateDeMiseAJourIndicateur}
                  </span>
                </p>
                {
                  !!territoireSélectionné && !!détailsIndicateur[territoireSélectionné.codeInsee] ? (
                    <p
                      className={`fr-mb-0 fr-text--xs${estIndicateurEnAlerte ? ' fr-text-warning' : ' texte-gris'}`}
                    >
                      Date prévisionnelle de mise à jour des données (de l'indicateur) :
                      {' '}
                      <span className='fr-text--bold'>
                        {dateProchaineDateMaj}
                      </span>
                    </p>
                  ) : null
                }
                {
                  !!territoireSélectionné && !!détailsIndicateur[territoireSélectionné.codeInsee] ? (
                    <IndicateurPonderation
                      indicateurPondération={détailsIndicateur[territoireSélectionné.codeInsee]?.pondération ?? null}
                      mailleSélectionnée={territoireSélectionné.maille}
                    />
                  ) : null
                }
              </div>
            </div>
          </div>
          {
            estVueTuile ? (
              informationsIndicateurs.map(value => (
                <Fragment key={value.territoireNom}>
                  <IndicateurBlocIndicateurTuile
                    indicateurDétailsParTerritoire={value}
                    typeDeRéforme='chantier'
                    unité={value.données.unité}
                  />
                </Fragment>
              ))
            ) : (
              <table className='fr-table w-full border-collapse fr-mb-0'>
                <caption className='fr-sr-only'>
                  Un tableau de l'indicateur :'
                </caption>
                <thead className='fr-background-action-low-blue-france'>
                  <tr>
                    <th className='fr-mb-0 fr-pl-2w fr-p-1w fr-py-md-1w fr-text--sm fr-text--bold'>
                      Territoire(s)
                    </th>
                    <th className='fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm fr-text--bold'>
                      Valeur initiale
                    </th>
                    <th className='fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm fr-text--bold'>
                      Valeur actuelle
                    </th>
                    <th className='fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm fr-text--bold'>
                      Cible 2024
                    </th>
                    <th className='fr-mb-0 fr-p-0 fr-px-2w fr-py-md-1w fr-text--sm fr-text--bold'>
                      {'Avancement ' + new Date().getFullYear().toString()}
                    </th>
                    <th className='fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm fr-text--bold'>
                      Cible 2026
                    </th>
                    <th className='fr-mb-0 fr-p-0 fr-px-2w fr-py-md-1w fr-text--sm fr-text--bold'>
                      Avancement 2026
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {
                  informationsIndicateurs.map(value => {
                    return (
                      <>
                        <tr key={value.territoireNom}>
                          <td className='fr-mb-0 fr-pl-2w fr-p-1w fr-py-md-1w fr-text--sm'>
                            {value.territoireNom}
                          </td>
                          <td className='fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm'>
                            <ValeurEtDate
                              date={value.données.dateValeurInitiale}
                              unité={value.données.unité}
                              valeur={value.données.valeurInitiale}
                            />
                          </td>
                          <td className='fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm'>
                            <ValeurEtDate
                              date={value.données.dateValeurActuelle}
                              unité={value.données.unité}
                              valeur={value.données.valeurActuelle}
                            />
                          </td>
                          <td className='fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm'>
                            <ValeurEtDate
                              date={value.données.dateValeurCibleAnnuelle}
                              unité={value.données.unité}
                              valeur={value.données.valeurCibleAnnuelle}
                            />
                          </td>
                          <td className='fr-mb-0 fr-p-0 fr-px-2w fr-py-md-1w fr-text--sm'>
                            <BarreDeProgression
                              afficherTexte
                              fond='gris-clair'
                              positionTexte='dessus'
                              taille='md'
                              valeur={value.données.avancement.annuel}
                              variante='secondaire'
                            />
                          </td>
                          <td className='fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm'>
                            <ValeurEtDate
                              date={value.données.dateValeurCible}
                              unité={value.données.unité}
                              valeur={value.données.valeurCible}
                            />
                          </td>
                          <td className='fr-mb-0 fr-p-0 fr-px-2w fr-py-md-1w fr-text--sm'>
                            <BarreDeProgression
                              afficherTexte
                              fond='gris-clair'
                              positionTexte='dessus'
                              taille='md'
                              valeur={value.données.avancement.global}
                              variante='primaire'
                            />
                          </td>
                        </tr>
                        {
                          estAutoriseAVoirLesPropositionsDeValeurActuelle ? (
                            <tr className='ligne-creation-proposition-valeur-actuelle'>
                              <td colSpan={7}>
                                <div className='flex w-full justify-end'>
                                  <button
                                    aria-controls={ID_HTML_MODALE_PROPOSITION_VALEUR_ACTUELLE}
                                    className='fr-btn fr-btn--secondary'
                                    data-fr-opened='false'
                                    type='button'
                                  >
                                    Proposer une autre valeur actuelle
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ) : null
                        }
                      </>
                    );
                  })
                }
                </tbody>
              </table>
            )
          }
          {
            estInteractif ? (
              <IndicateurDétails
                chantierEstTerritorialisé={chantierEstTerritorialisé}
                dateDeMiseAJourIndicateur={dateDeMiseAJourIndicateur}
                indicateur={indicateur}
                indicateurDétailsParTerritoires={informationsIndicateurs}
                typeDeRéforme={typeDeRéforme}
              />
            ) : null
          }
        </section>
      </Bloc>
      <ModalePropositonValeurActuelle />
    </IndicateurBlocStyled>
  );
};

export default IndicateurBloc;
