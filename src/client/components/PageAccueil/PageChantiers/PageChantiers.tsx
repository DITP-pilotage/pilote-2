import '@gouvfr/dsfr/dist/component/form/form.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-device/icons-device.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-document/icons-document.min.css';
import Link from 'next/link';
import { FunctionComponent } from 'react';
import { useSession } from 'next-auth/react';
import {
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
  useQueryStates,
} from 'nuqs';
import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import CartographieAvancement
  from '@/components/_commons/Cartographie/CartographieAvancementNew/CartographieAvancement';
import useCartographie from '@/components/_commons/Cartographie/useCartographieNew';
import ExportDesDonnées, {
  ID_HTML_MODALE_EXPORT,
} from '@/components/PageAccueil/PageChantiers/ExportDesDonnées/ExportDesDonnées';
import {
  ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS,
} from '@/client/constants/légendes/élémentsDeLégendesCartographieAvancement';
import FiltresActifs from '@/client/components/PageAccueil/FiltresActifsNew/FiltresActifs';
import Infobulle from '@/components/_commons/Infobulle/Infobulle';
import INFOBULLE_CONTENUS from '@/client/constants/infobulles';
import TitreInfobulleConteneur from '@/components/_commons/TitreInfobulleConteneur/TitreInfobulleConteneur';
import RemontéeAlerte from '@/components/_commons/RemontéeAlerteChantier/RemontéeAlerte';
import BadgeIcône from '@/components/_commons/BadgeIcône/BadgeIcône';
import { estAutoriséAConsulterLaFicheTerritoriale } from '@/client/utils/fiche-territoriale/fiche-territoriale';
import { JaugeDeProgressionSmall } from '@/components/_commons/JaugeDeProgressionSmall/JaugeDeProgressionSmall';
import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import { ChantierAccueilContrat } from '@/server/chantiers/app/contrats/ChantierAccueilContratNew';
import Axe from '@/server/domain/axe/Axe.interface';
import {
  AvancementsGlobauxTerritoriauxMoyensContrat,
  AvancementsStatistiquesAccueilContrat,
} from '@/server/chantiers/app/contrats/AvancementsStatistiquesAccueilContrat';
import { getQueryParamString } from '@/client/utils/getQueryParamString';
import { TypeAlerteChantier } from '@/server/chantiers/app/contrats/TypeAlerteChantier';
import SelecteurVueStatuts from '@/client/components/PageAccueil/SelecteurVueStatuts/SelecteurVueStatuts';
import { estLargeurDÉcranActuelleMoinsLargeQue } from '@/client/stores/useLargeurDÉcranStore/useLargeurDÉcranStore';
import SélecteurMaille
  from '@/components/_commons/SélecteursMaillesEtTerritoiresChantier/SélecteurMaille/SélecteurMaille';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';
import JaugeDeProgression from '@/components/_commons/JaugeDeProgression/JaugeDeProgression';
import { RepartitionMeteoContrat } from '@/server/fiche-territoriale/app/contrats/RepartitionMeteoContrat';
import { sauvegarderFiltres } from '@/stores/useFiltresStoreNew/useFiltresStoreNew';
import Sélecteur from '@/components/_commons/Sélecteur/Sélecteur';
import {
  ExportDesDonneesV2,
  ID_HTML_MODALE_EXPORT_V2,
} from '@/components/PageAccueil/PageChantiers/ExportDesDonneesV2/ExportDesDonneesV2';
import PageChantiersStyled from './PageChantiers.styled';
import TableauChantiers from './TableauChantiers/TableauChantiers';
import usePageChantiers from './usePageChantiers';
import RepartitionsMeteosChantiers from './FiltresMeteos/RepartitionsMeteosChantiers';

interface PageChantiersProps {
  chantiers: ChantierAccueilContrat[],
  chantiersIdsExport: string[]
  nombreTotalChantiersAvecAlertes: number
  ministères: Ministère[]
  axes: Axe[],
  territoireCode: string
  mailleSelectionnee: MailleInterne
  mailleQuery: MailleInterne
  filtresComptesCalculés: Record<TypeAlerteChantier, number>
  avancementsAgrégés: AvancementsStatistiquesAccueilContrat
  avancementsGlobauxTerritoriauxMoyens: AvancementsGlobauxTerritoriauxMoyensContrat
  repartitionMeteosChantiers: RepartitionMeteoContrat
  jalon: number
}

const PageChantiers: FunctionComponent<PageChantiersProps> = ({
  chantiers,
  chantiersIdsExport,
  nombreTotalChantiersAvecAlertes,
  ministères,
  axes,
  territoireCode,
  mailleSelectionnee,
  mailleQuery,
  filtresComptesCalculés,
  avancementsAgrégés,
  avancementsGlobauxTerritoriauxMoyens,
  repartitionMeteosChantiers,
  jalon,
}) => {

  const { data: session } = useSession();
  const estVueMobile = estLargeurDÉcranActuelleMoinsLargeQue('sm');

  const pathname = '/accueil/chantier/[territoireCode]';
  const { auClicTerritoireCallback } = useCartographie(territoireCode, pathname);

  const [filtres] = useQueryStates({
    perimetres: parseAsString.withDefault(''),
    axes: parseAsString.withDefault(''),
    meteos: parseAsString.withDefault(''),
    estBarometre: parseAsBoolean.withDefault(false),
    estTerritorialise: parseAsBoolean.withDefault(false),
    maille: parseAsString.withDefault(''),
    statut: parseAsStringLiteral(['BROUILLON', 'PUBLIE', 'BROUILLON_ET_PUBLIE', 'ARCHIVE']),
    jalon: parseAsStringLiteral(['2024', '2025']),
  });

  const [filtresAlertes] = useQueryStates({
    estEnAlerteTauxAvancementNonCalculé: parseAsBoolean.withDefault(false),
    estEnAlerteÉcart: parseAsBoolean.withDefault(false),
    estEnAlerteBaisse: parseAsBoolean.withDefault(false),
    estEnAlerteMétéoNonRenseignée: parseAsBoolean.withDefault(false),
    estEnAlerteAbscenceTauxAvancementDepartemental: parseAsBoolean.withDefault(false),
    estEnAlertePossedePropositionsValeurActuelle: parseAsBoolean.withDefault(false),
  });

  const nombreFiltresActifs = filtres.axes.split(',').filter(Boolean).length
    + filtres.perimetres.split(',').filter(Boolean).length
    + filtres.meteos.split(',').filter(Boolean).length
    + (filtres.estBarometre ? 1 : 0)
    + (filtres.estTerritorialise ? 1 : 0)
    + (filtresAlertes.estEnAlerteTauxAvancementNonCalculé ? 1 : 0)
    + (filtresAlertes.estEnAlerteÉcart ? 1 : 0)
    + (filtresAlertes.estEnAlerteBaisse ? 1 : 0)
    + (filtresAlertes.estEnAlerteMétéoNonRenseignée ? 1 : 0)
    + (filtresAlertes.estEnAlerteAbscenceTauxAvancementDepartemental ? 1 : 0)
    + (filtresAlertes.estEnAlertePossedePropositionsValeurActuelle ? 1 : 0);

  const [, setJalon] = useQueryState('jalon', parseAsStringLiteral(['2024', '2025']).withDefault('2024').withOptions({
    shallow: false,
    history: 'push',
  }));

  const [optionsExport, setOptionsExport] = useQueryStates({
    etapeCourante: parseAsInteger.withDefault(1).withOptions({
      shallow: true,
    }),
    isModaleExportCsvOuverte: parseAsBoolean.withDefault(false).withOptions({
      shallow: true,
      clearOnDefault: true,
      history: 'push',
    }),
    typeExport: parseAsStringLiteral(['ppg', 'indicateurs']).withDefault('ppg').withOptions({
      shallow: true,
    }),
  });

  const auClickSelecteurJalon = (valeur: '2024' | '2025') => {
    sauvegarderFiltres({ jalon: valeur });
    setJalon(valeur);
  };

  const queryParamString = getQueryParamString({ ...filtres, ...filtresAlertes });

  const {
    donnéesTableauChantiers,
    remontéesAlertes,
    estAutoriseAVoirLeSelecteurDeMaille,
    estExportV2Actif,
  } = usePageChantiers(chantiers, territoireCode, filtresComptesCalculés, avancementsAgrégés, session!.profil);

  const chantiersSontArchives = filtres.statut?.includes('ARCHIVE') ?? false;

  return (
    <PageChantiersStyled>
      {
        nombreFiltresActifs > 0 ? (
          <FiltresActifs
            axes={axes}
            mailleSelectionnee={mailleSelectionnee}
            ministères={ministères}
          />
        ) : null
      }
      <div className='fr-py-2w fr-px-md-2w fr-container--fluid'>
        <div className='fr-mb-2w titre flex align-center'>
          <Titre
            baliseHtml='h1'
            className={`fr-h4 fr-px-2w fr-px-md-0 fr-mb-0 ${chantiersSontArchives ? 'titre-gris' : ''}`}
          >
            {`${nombreTotalChantiersAvecAlertes} ${nombreTotalChantiersAvecAlertes >= 2 ? 'chantiers' : 'chantier'}`}
          </Titre>
          <div className='titre-liens'>
            {
              process.env.NEXT_PUBLIC_FF_FICHE_TERRITORIALE === 'true' && estAutoriséAConsulterLaFicheTerritoriale(session?.profil || '') && !estVueMobile ? (
                <div>
                  {
                    territoireCode === 'NAT-FR' ? (
                      <button
                        className='fr-btn fr-btn--tertiary-no-outline fr-icon-article-line fr-btn--icon-left fr-text--sm'
                        disabled
                        title='Veuillez séléctionner un territoire pour accéder à sa fiche territoriale'
                        type='button'
                      >
                        Fiche territoriale
                      </button>
                    ) : (
                      <Link
                        className='fr-btn fr-btn--tertiary-no-outline fr-icon-article-line fr-btn--icon-left fr-text--sm fr-px-1w fr-px-md-2w'
                        href={`/fiche-territoriale?territoireCode=${territoireCode}`}
                        title='Voir la fiche territoriale'
                      >
                        Fiche territoriale
                      </Link>
                    )
                  }
                </div>
              ) : null
            }
            {
              process.env.NEXT_PUBLIC_FF_RAPPORT_DETAILLE === 'true' && !estVueMobile ? (
                <div>
                  <Link
                    className='fr-btn fr-btn--tertiary-no-outline fr-icon-article-line fr-btn--icon-left fr-text--sm fr-px-1w fr-px-md-2w'
                    href={`${territoireCode}/rapport-detaille${queryParamString.length > 0 ? `?${queryParamString}` : ''}`}
                    title='Voir le rapport détaillé'
                  >
                    Voir le rapport détaillé
                  </Link>
                </div>
              ) : null
            }
            {
              process.env.NEXT_PUBLIC_FF_EXPORT_CSV === 'true' && !estVueMobile ? (
                <div>
                  <button
                    aria-controls={ID_HTML_MODALE_EXPORT}
                    className='fr-btn fr-btn--tertiary-no-outline fr-icon-download-line fr-btn--icon-left fr-text--sm fr-px-1w fr-px-md-2w'
                    data-fr-opened='false'
                    type='button'
                  >
                    Exporter les données
                  </button>
                  <ExportDesDonnées listeChantierId={chantiersIdsExport} />
                </div>
              ) : null
            }
            {
              estExportV2Actif && !estVueMobile ? (
                <div>
                  <button
                    aria-controls={ID_HTML_MODALE_EXPORT_V2}
                    className='fr-btn fr-btn--tertiary-no-outline fr-icon-download-line fr-btn--icon-left fr-text--sm fr-px-1w fr-px-md-2w'
                    data-fr-opened={optionsExport.isModaleExportCsvOuverte}
                    onClick={() => {
                      setOptionsExport({
                        isModaleExportCsvOuverte: true,
                        etapeCourante: 1,
                        typeExport: 'ppg',
                      });
                    }}
                    type='button'
                  >
                    Exporter les données V2
                  </button>
                  <ExportDesDonneesV2
                    fermetureCallback={() => {
                      setOptionsExport({
                        etapeCourante: 1,
                        typeExport: 'ppg',
                      }, { clearOnDefault: true, shallow: true });
                      setOptionsExport({
                        isModaleExportCsvOuverte: false,
                      }, { clearOnDefault: true, shallow: true });
                    }}
                  />
                </div>
              ) : null
            }
          </div>
        </div>
        <div className='fr-grid-row'>
          <div className='fr-col-12 fr-col-lg-7 fr-col-xl-6 flex flex-column'>
            <section className='flex flex-1'>
              <div className='fr-container fr-p-0 flex flex-1'>
                <div className='fr-grid-row fr-grid-row--gutters fr-mb-0 fr-mt-0 w-full fr-mr-md-2w'>
                  <div className='fr-col-12 fr-col-xl-6 flex flex-column align-center fr-pr-0 fr-pt-0'>
                    <Bloc
                      className='w-full h-full'
                      contenuClassesSupplémentaires='fr-p-2w'
                    >
                      <TitreInfobulleConteneur>
                        <Titre
                          baliseHtml='h2'
                          className='fr-text--lg fr-mb-0 fr-py-1v'
                          estInline
                        >
                          Taux d'avancement moyen
                        </Titre>
                        <Infobulle idHtml='infobulle-chantiers-jauges'>
                          {INFOBULLE_CONTENUS.chantiers.jauges}
                        </Infobulle>
                      </TitreInfobulleConteneur>
                      <div className='flex w-full justify-center fr-px-1w fr-mt-1w'>
                        <JaugeDeProgression
                          couleur={chantiersSontArchives ? 'gris' : 'bleu'}
                          libellé="Taux d'avancement à échéance 2026"
                          pourcentage={avancementsAgrégés?.global.moyenne || null}
                          taille='lg'
                        />
                      </div>
                      <div className='fr-grid-row border-t fr-mt-1w'>
                        <div className='fr-mt-1w w-full'>
                          <p className='fr-text--xl fr-text--bold fr-mb-0 texte-gris'>
                            {`${(process.env.NEXT_PUBLIC_FF_TA_ANNUEL === 'true' ? avancementsAgrégés?.annuel.moyenne?.toFixed(0) : null) ?? '- '}%`}
                          </p>
                          <BarreDeProgression
                            afficherTexte={false}
                            bordure={null}
                            fond='gris-clair'
                            positionTexte='dessus'
                            taille='xxs'
                            valeur={!!avancementsAgrégés && process.env.NEXT_PUBLIC_FF_TA_ANNUEL === 'true' ? avancementsAgrégés.annuel.moyenne : null}
                            variante='secondaire'
                          />
                          <div className='flex flex-wrap justify-center'>
                            <p className='fr-text--xs fr-mb-0 fr-mt-1v text-center'>
                              Taux d'avancement à échéance
                            </p>
                            <div className='select-sm flex align-center justify-center w-full relative'>
                              <Sélecteur<'2024' | '2025'>
                                htmlName='jalon'
                                options={[{ libellé: '2024', valeur: '2024' }, { libellé: '2025', valeur: '2025' }]}
                                texteFantôme='Sélectionner un jalon'
                                valeurModifiéeCallback={auClickSelecteurJalon}
                                valeurSélectionnée={`${jalon}` as '2024' | '2025'}
                              />
                              <Infobulle
                                idHtml='infobulle-selecteur-jalon'
                              >
                                {INFOBULLE_CONTENUS.chantiers.jalon}
                              </Infobulle>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Bloc>
                  </div>
                  <div className='fr-col-12 fr-col-xl-6 fr-pr-0 fr-pt-0'>
                    <Bloc
                      className='h-full fr-ml-xl-1w'
                      contenuClassesSupplémentaires='fr-p-2w'
                    >
                      <div className='fr-container fr-p-0'>
                        <TitreInfobulleConteneur>
                          <Titre
                            baliseHtml='h2'
                            className='fr-text--lg fr-m-0 fr-py-1v '
                            estInline
                          >
                            Répartition territoriale
                          </Titre>
                          <Infobulle
                            idHtml='infobulle-chantiers-jauges-repartitions'
                          >
                            {INFOBULLE_CONTENUS.chantiers.repartitions}
                          </Infobulle>
                        </TitreInfobulleConteneur>
                        {
                          estAutoriseAVoirLeSelecteurDeMaille ? (
                            <div
                              className='fr-grid-row fr-pb-2w fr-text--sm repartition-selecteur-maille'
                            >
                              <SélecteurMaille
                                mailleQuery={mailleQuery}
                                pathname={pathname}
                              />
                            </div>
                          ) : null
                        }
                        <div className='flex flex-column items-center fr-px-3v'>
                          <JaugeDeProgressionSmall
                            couleur={chantiersSontArchives ? 'gris' : 'vert'}
                            libellé='Maximum'
                            pourcentage={avancementsAgrégés?.global.maximum || null}
                          />
                          <JaugeDeProgressionSmall
                            couleur={chantiersSontArchives ? 'gris' : 'violet'}
                            libellé='Médiane'
                            pourcentage={avancementsAgrégés?.global.médiane || null}
                          />
                          <JaugeDeProgressionSmall
                            couleur={chantiersSontArchives ? 'gris' : 'orange'}
                            libellé='Minimum'
                            pourcentage={avancementsAgrégés?.global.minimum || null}
                          />
                        </div>
                      </div>
                    </Bloc>
                  </div>
                </div>
              </div>
            </section>
            <section className='fr-mr-md-2w fr-mr-xl-0'>
              <Bloc
                contenuClassesSupplémentaires='fr-py-2w fr-px-3w'
              >
                <TitreInfobulleConteneur>
                  <Titre
                    baliseHtml='h2'
                    className='fr-text--lg fr-mb-0 fr-py-1v'
                    estInline
                  >
                    Répartition des météos renseignées
                  </Titre>
                  <Infobulle idHtml='infobulle-chantiers-météos'>
                    {INFOBULLE_CONTENUS.chantiers.météos}
                  </Infobulle>
                </TitreInfobulleConteneur>
                <RepartitionsMeteosChantiers
                  repartitionMeteos={repartitionMeteosChantiers}
                />
              </Bloc>
            </section>
          </div>
          <div className='fr-col-12 fr-col-lg-5 fr-col-xl-6 fr-pl-xl-1w'>
            <Bloc>
              <section>
                <Titre
                  baliseHtml='h2'
                  className='fr-text--lg break-keep fr-mb-0 fr-py-1v'
                >
                  Taux d'avancement des chantiers par territoire
                </Titre>
                {
                  estAutoriseAVoirLeSelecteurDeMaille ? (
                    <SélecteurMaille
                      mailleQuery={mailleQuery}
                      pathname={pathname}
                    />
                  ) : null
                }
                <CartographieAvancement
                  auClicTerritoireCallback={auClicTerritoireCallback}
                  données={avancementsGlobauxTerritoriauxMoyens}
                  jalon={jalon}
                  mailleSelectionnee={mailleQuery}
                  pathname='/accueil/chantier/[territoireCode]'
                  territoireCode={territoireCode}
                  élémentsDeLégende={ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS}
                />
              </section>
            </Bloc>
          </div>
        </div>
        {
          process.env.NEXT_PUBLIC_FF_ALERTES === 'true' && !chantiersSontArchives &&
          <div className='fr-pt-2w fr-px-2w fr-px-md-0 alertes'>
            <div className='fr-mb-2w'>
              <TitreInfobulleConteneur>
                <BadgeIcône type='warning' />
                <Titre
                  baliseHtml='h2'
                  className='fr-text--lg fr-mb-0 fr-py-1v fr-ml-1w titre-remontée-alertes'
                  estInline
                >
                  Chantiers signalés
                </Titre>
                <Infobulle idHtml='infobulle-chantiers-alertes'>
                  {INFOBULLE_CONTENUS.chantiers.alertes}
                </Infobulle>
              </TitreInfobulleConteneur>
            </div>
            <div className='fr-grid-row fr-mx-n1v fr-mx-md-n1w'>
              {
                remontéesAlertes.map(({ nomCritère, libellé, nombre, estActivée }) => (
                  (process.env.NEXT_PUBLIC_FF_ALERTES_BAISSE === 'true' || nomCritère !== 'estEnAlerteBaisse') &&
                  <div
                    className='fr-col fr-px-1v fr-px-md-1w'
                    key={libellé}
                    title={libellé}
                  >
                    <RemontéeAlerte
                      estActivée={estActivée}
                      libellé={libellé}
                      nomCritère={nomCritère}
                      nombre={nombre}
                    />
                  </div>
                ))
              }
            </div>
          </div>
        }
        <div className='fr-grid-row fr-mt-7v'>
          <div className='fr-col-12'>
            <Bloc>
              <TitreInfobulleConteneur>
                <Titre
                  baliseHtml='h2'
                  className='fr-text--lg fr-mb-0 fr-py-1v'
                  estInline
                >
                  {`Liste des chantiers (${nombreTotalChantiersAvecAlertes})`}
                </Titre>
                <Infobulle idHtml='infobulle-chantiers-listeDesChantiers'>
                  {INFOBULLE_CONTENUS.chantiers.listeDesChantiers}
                </Infobulle>
              </TitreInfobulleConteneur>
              <SelecteurVueStatuts />
              <TableauChantiers
                chantiersSontArchives={chantiersSontArchives ?? false}
                données={donnéesTableauChantiers}
                jalon={jalon}
                ministèresDisponibles={ministères}
                nombreTotalChantiersAvecAlertes={nombreTotalChantiersAvecAlertes}
                territoireCode={territoireCode}
              />
            </Bloc>
          </div>
        </div>
      </div>
    </PageChantiersStyled>
  );
};

export default PageChantiers;
