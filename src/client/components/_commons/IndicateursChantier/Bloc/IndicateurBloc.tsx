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
import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import { TypeDeRéforme } from '@/stores/useTypeDeRéformeStore/useTypedeRéformeStore.interface';
import { estLargeurDÉcranActuelleMoinsLargeQue } from '@/stores/useLargeurDÉcranStore/useLargeurDÉcranStore';
import ValeurEtDate from '@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/ValeurEtDate';
import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import IndicateurBlocIndicateurTuile
  from '@/components/_commons/IndicateursChantier/Bloc/indicateurBlocIndicateurTuile';
import ModalePropositonValeurActuelle
  from '@/components/_commons/IndicateursChantier/Bloc/ModalePropositonValeurActuelle/ModalePropositonValeurActuelle';
import Infobulle from '@/components/_commons/Infobulle/Infobulle';
import { formaterDate } from '@/client/utils/date/date';
import IndicateurTendance from '@/components/_commons/IndicateursChantier/Bloc/Tendances/IndicateurTendance';
import IndicateurBlocStyled from './IndicateurBloc.styled';
import useIndicateurBloc from './useIndicateurBloc';
import useIndicateurAlerteDateMaj from './useIndicateurAlerteDateMaj';

export const ID_HTML_MODALE_PROPOSITION_VALEUR_ACTUELLE = 'modale-proposition-valeur-actuelle';

interface IndicateurBlocProps {
  indicateur: Indicateur
  détailsIndicateurs: DétailsIndicateurs
  estInteractif: boolean
  typeDeRéforme: TypeDeRéforme,
  chantierEstTerritorialisé: boolean,
  estAutoriseAVoirLesPropositionsDeValeurActuelle: boolean,
  listeSousIndicateurs: Indicateur[]
}

const IndicateurBloc: FunctionComponent<IndicateurBlocProps> = ({
  indicateur,
  détailsIndicateurs,
  estInteractif,
  typeDeRéforme,
  chantierEstTerritorialisé,
  estAutoriseAVoirLesPropositionsDeValeurActuelle = false,
  listeSousIndicateurs,
}) => {
  const estVueTuile = estLargeurDÉcranActuelleMoinsLargeQue('sm');
  const territoiresComparés = territoiresComparésTerritoiresStore();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  const détailsIndicateur = détailsIndicateurs[indicateur.id];

  const { data: variableContenuFFPropositionValeurActuelle } = api.gestionContenu.récupérerVariableContenu.useQuery({ nomVariableContenu: 'NEXT_PUBLIC_FF_PROPOSITION_VALEUR_ACTUELLE' });

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

  const { estIndicateurEnAlerte } = useIndicateurAlerteDateMaj(détailsIndicateur, territoireSélectionné);

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
                    <div
                      className={`flex align-center relative${estIndicateurEnAlerte ? ' fr-text-warning' : ' texte-gris'}`}
                    >
                      <p className='fr-mb-0 fr-text--xs'>
                        Date prévisionnelle de la prochaine mise à jour des données (de l’indicateur) :
                        {' '}
                        <span className='fr-text--bold'>
                          {dateProchaineDateMaj}
                        </span>
                      </p>
                      <Infobulle
                        className='infobulle-date-previsionnelle'
                        idHtml='infobulle-date-previsionnelle'
                      >
                        <p className='fr-text-title--blue-france'>
                          Date prévisionnelle de mise à jour de l’indicateur :
                        </p>
                        <p>
                          Elle dépend de la date de valeur actuelle, de la période de mise à jour et du délai de
                          disponibilité des données. Plus d'informations dans l'accordéon "définition de l’indicateur et
                          calendrier de mise à jour".
                        </p>
                      </Infobulle>
                    </div>
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
              {
                territoireSélectionné && détailsIndicateur[territoireSélectionné.codeInsee]?.tendance === 'BAISSE' ? (
                  <IndicateurTendance />
                ) : null
              }
            </div>
          </div>
          {
            estVueTuile ? (
              informationsIndicateurs.map(informationIndicateur => (
                <Fragment key={informationIndicateur.territoireNom}>
                  <IndicateurBlocIndicateurTuile
                    indicateurDétailsParTerritoire={informationIndicateur}
                    typeDeRéforme='chantier'
                    unité={informationIndicateur.données.unité}
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
                  informationsIndicateurs.map(informationIndicateur => {
                    return informationIndicateur.données ? ( // TODO supprimer une fois le refacto fait ! A cause de la react query y'a quelques frames où informationIndicateur.données est undefined
                      <Fragment key={informationIndicateur.territoireNom}>
                        <tr key={informationIndicateur.territoireNom}>
                          <td className='fr-mb-0 fr-pl-2w fr-p-1w fr-py-md-1w fr-text--sm'>
                            {informationIndicateur.territoireNom}
                          </td>
                          <td className='fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm'>
                            <ValeurEtDate
                              date={informationIndicateur.données.dateValeurInitiale}
                              unité={informationIndicateur.données.unité}
                              valeur={informationIndicateur.données.valeurInitiale}
                            />
                          </td>
                          <td className='fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm'>
                            <ValeurEtDate
                              date={informationIndicateur.données.dateValeurActuelle}
                              unité={informationIndicateur.données.unité}
                              valeur={informationIndicateur.données.valeurActuelle}
                            />
                          </td>
                          <td className='fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm'>
                            <ValeurEtDate
                              date={informationIndicateur.données.dateValeurCibleAnnuelle}
                              unité={informationIndicateur.données.unité}
                              valeur={informationIndicateur.données.valeurCibleAnnuelle}
                            />
                          </td>
                          <td className='fr-mb-0 fr-p-0 fr-px-2w fr-py-md-1w fr-text--sm'>
                            <BarreDeProgression
                              afficherTexte
                              fond='gris-clair'
                              positionTexte='dessus'
                              taille='md'
                              valeur={informationIndicateur.données.avancement.annuel}
                              variante='secondaire'
                            />
                          </td>
                          <td className='fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm'>
                            <ValeurEtDate
                              date={informationIndicateur.données.dateValeurCible}
                              unité={informationIndicateur.données.unité}
                              valeur={informationIndicateur.données.valeurCible}
                            />
                          </td>
                          <td className='fr-mb-0 fr-p-0 fr-px-2w fr-py-md-1w fr-text--sm'>
                            <BarreDeProgression
                              afficherTexte
                              fond='gris-clair'
                              positionTexte='dessus'
                              taille='md'
                              valeur={informationIndicateur.données.avancement.global}
                              variante='primaire'
                            />
                          </td>
                        </tr>
                        {
                          variableContenuFFPropositionValeurActuelle ? estAutoriseAVoirLesPropositionsDeValeurActuelle && informationIndicateur.données.valeurActuelle !== null && informationIndicateur.données.proposition === null ? (
                            <tr className='ligne-creation-proposition-valeur-actuelle'>
                              <td colSpan={7}>
                                <div className='flex w-full justify-end'>
                                  <button
                                    aria-controls={ID_HTML_MODALE_PROPOSITION_VALEUR_ACTUELLE + indicateur.id}
                                    className='fr-btn fr-btn--icon-left fr-icon-edit-fill fr-btn--secondary'
                                    data-fr-opened='false'
                                    type='button'
                                  >
                                    Proposer une autre valeur actuelle
                                  </button>
                                </div>
                                <ModalePropositonValeurActuelle
                                  detailIndicateur={informationIndicateur.données}
                                  generatedHTMLID={ID_HTML_MODALE_PROPOSITION_VALEUR_ACTUELLE + indicateur.id}
                                  indicateur={indicateur}
                                />
                              </td>
                            </tr>
                          ) : informationIndicateur.données.proposition !== null ? (
                            <>
                              <tr
                                className='ligne-modification-proposition-valeur-actuelle'
                                key={informationIndicateur.territoireNom}
                              >
                                <td className='fr-mb-0 fr-pl-2w fr-p-1w fr-py-md-1w fr-text--sm'>
                                  <div className='flex align-center'>
                                    <span className='texte-proposition'>
                                      Proposition du territoire
                                    </span>
                                    <Infobulle idHtml='infobulle-proposition-valeur-actuelle'>
                                      <p className='texte-proposition'>
                                        Valeur actuelle proposée
                                        le
                                        {' '}
                                        {formaterDate(informationIndicateur.données.proposition.dateProposition?.toISOString(), 'DD/MM/YYYY')}
                                        {' '}
                                        par
                                        {' '}
                                        {informationIndicateur.données.proposition.auteur}
                                      </p>
                                      <p>
                                        {informationIndicateur.données.proposition.motif}
                                      </p>
                                      <p>
                                        {informationIndicateur.données.proposition.sourceDonneeEtMethodeCalcul}
                                      </p>
                                    </Infobulle>
                                  </div>
                                </td>
                                <td className='fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm'>
                                  <ValeurEtDate
                                    date={informationIndicateur.données.dateValeurInitiale}
                                    unité={informationIndicateur.données.unité}
                                    valeur={informationIndicateur.données.valeurInitiale}
                                  />
                                </td>
                                <td className='fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm texte-proposition'>
                                  <ValeurEtDate
                                    date={informationIndicateur.données.dateValeurActuelle}
                                    unité={informationIndicateur.données.unité}
                                    valeur={informationIndicateur.données.proposition.valeurActuelle}
                                  />
                                </td>
                                <td className='fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm'>
                                  <ValeurEtDate
                                    date={informationIndicateur.données.dateValeurCibleAnnuelle}
                                    unité={informationIndicateur.données.unité}
                                    valeur={informationIndicateur.données.valeurCibleAnnuelle}
                                  />
                                </td>
                                <td className='fr-mb-0 fr-p-0 fr-px-2w fr-py-md-1w fr-text--sm texte-proposition'>
                                  <BarreDeProgression
                                    afficherTexte
                                    fond='gris-clair'
                                    positionTexte='dessus'
                                    taille='md'
                                    valeur={informationIndicateur.données.proposition.tauxAvancementIntermediaire}
                                    variante='primaire-light'
                                  />
                                </td>
                                <td className='fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm'>
                                  <ValeurEtDate
                                    date={informationIndicateur.données.dateValeurCible}
                                    unité={informationIndicateur.données.unité}
                                    valeur={informationIndicateur.données.valeurCible}
                                  />
                                </td>
                                <td className='fr-mb-0 fr-p-0 fr-px-2w fr-py-md-1w fr-text--sm texte-proposition'>
                                  <BarreDeProgression
                                    afficherTexte
                                    fond='gris-clair'
                                    positionTexte='dessus'
                                    taille='md'
                                    valeur={informationIndicateur.données.proposition.tauxAvancement}
                                    variante='primaire-light'
                                  />
                                </td>
                              </tr>
                              {
                                  estAutoriseAVoirLesPropositionsDeValeurActuelle ? (
                                    <tr className='ligne-modification-proposition-valeur-actuelle'>
                                      <td colSpan={7}>
                                        <div className='flex w-full justify-end'>
                                          <button
                                            aria-controls={ID_HTML_MODALE_PROPOSITION_VALEUR_ACTUELLE + indicateur.id}
                                            className='fr-btn fr-btn--icon-left fr-icon-edit-fill fr-btn--secondary'
                                            data-fr-opened='false'
                                            type='button'
                                          >
                                            Editer la proposition
                                          </button>
                                        </div>
                                        <ModalePropositonValeurActuelle
                                          detailIndicateur={informationIndicateur.données}
                                          generatedHTMLID={ID_HTML_MODALE_PROPOSITION_VALEUR_ACTUELLE + indicateur.id}
                                          indicateur={indicateur}
                                        />
                                      </td>
                                    </tr>
                                  ) : null
                                }
                            </>
                          ) : null
                            : null
                        }
                      </Fragment>
                    ) : null;
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
                détailsIndicateurs={détailsIndicateurs}
                indicateur={indicateur}
                indicateurDétailsParTerritoires={informationsIndicateurs}
                listeSousIndicateurs={listeSousIndicateurs}
                typeDeRéforme={typeDeRéforme}
              />
            ) : null
          }
        </section>
      </Bloc>
    </IndicateurBlocStyled>
  );
};

export default IndicateurBloc;
