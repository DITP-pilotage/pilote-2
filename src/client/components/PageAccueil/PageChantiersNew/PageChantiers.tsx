import '@gouvfr/dsfr/dist/component/form/form.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-device/icons-device.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-document/icons-document.min.css';
import Link from 'next/link';
import { FunctionComponent } from 'react';
import { useSession } from 'next-auth/react';
import { parseAsBoolean, parseAsString, useQueryStates } from 'nuqs';
import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import CartographieAvancement
  from '@/components/_commons/Cartographie/CartographieAvancementNew/CartographieAvancement';
import useCartographie from '@/components/_commons/Cartographie/useCartographieNew';
import ExportDesDonnées, {
  ID_HTML_MODALE_EXPORT,
} from '@/components/PageAccueil/PageChantiersNew/ExportDesDonnées/ExportDesDonnées';
import {
  ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS,
} from '@/client/constants/légendes/élémentsDeLégendesCartographieAvancement';
import FiltresActifs from '@/client/components/PageAccueil/FiltresActifsNew/FiltresActifs';
import RépartitionMétéo from '@/components/_commons/RépartitionMétéo/RépartitionMétéo';
import Infobulle from '@/components/_commons/Infobulle/Infobulle';
import INFOBULLE_CONTENUS from '@/client/constants/infobulles';
import TitreInfobulleConteneur from '@/components/_commons/TitreInfobulleConteneur/TitreInfobulleConteneur';
import RemontéeAlerte from '@/components/_commons/RemontéeAlerteNew/RemontéeAlerte';
import BadgeIcône from '@/components/_commons/BadgeIcône/BadgeIcône';
import SélecteurVueStatuts from '@/components/PageAccueil/SélecteurVueStatutsNew/SélecteurVueStatuts';
import { estAutoriséAConsulterLaFicheTerritoriale } from '@/client/utils/fiche-territoriale/fiche-territoriale';
import JaugeDeProgression from '@/components/_commons/JaugeDeProgression/JaugeDeProgression';
import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import { ChantierAccueilContrat } from '@/server/chantiers/app/contrats/ChantierAccueilContratNew';
import Axe from '@/server/domain/axe/Axe.interface';
import {
  AvancementsGlobauxTerritoriauxMoyensContrat,
  AvancementsStatistiquesAccueilContrat,
  RépartitionsMétéos,
} from '@/server/chantiers/app/contrats/AvancementsStatistiquesAccueilContrat';
import PageChantiersStyled from './PageChantiers.styled';
import TableauChantiers from './TableauChantiers/TableauChantiers';
import usePageChantiers from './usePageChantiers';

interface PageChantiersProps {
  chantiers: ChantierAccueilContrat[],
  ministères: Ministère[]
  axes: Axe[],
  territoireCode: string
  mailleSelectionnee: 'départementale' | 'régionale'
  brouillon: boolean
  filtresComptesCalculés: Record<string, { nombre: number }>
  avancementsAgrégés: AvancementsStatistiquesAccueilContrat
  avancementsGlobauxTerritoriauxMoyens: AvancementsGlobauxTerritoriauxMoyensContrat
  répartitionMétéos: RépartitionsMétéos
}

const PageChantiers: FunctionComponent<PageChantiersProps> = ({
  chantiers,
  ministères,
  axes,
  territoireCode,
  mailleSelectionnee,
  brouillon,
  filtresComptesCalculés,
  avancementsAgrégés,
  avancementsGlobauxTerritoriauxMoyens,
  répartitionMétéos,
}) => {

  const { data: session } = useSession();

  const { auClicTerritoireCallback } = useCartographie(territoireCode, mailleSelectionnee);

  const [filtres] = useQueryStates({
    perimetres: parseAsString.withDefault(''),
    axes: parseAsString.withDefault(''),
    estBarometre: parseAsBoolean.withDefault(false),
    estTerritorialise: parseAsBoolean.withDefault(false),
  });

  const [filtresAlertes] = useQueryStates({
    estEnAlerteTauxAvancementNonCalculé: parseAsBoolean.withDefault(false),
    estEnAlerteÉcart: parseAsBoolean.withDefault(false),
    estEnAlerteBaisseOuStagnation: parseAsBoolean.withDefault(false),
    estEnAlerteDonnéesNonMàj: parseAsBoolean.withDefault(false),
    estEnAlerteMétéoNonRenseignée: parseAsBoolean.withDefault(false),
  });

  const nombreFiltresActifs = filtres.axes.split(',').filter(Boolean).length
    + filtres.perimetres.split(',').filter(Boolean).length
    + (filtres.estBarometre ? 1 : 0)
    + (filtres.estTerritorialise ? 1 : 0)
    + (filtresAlertes.estEnAlerteTauxAvancementNonCalculé ? 1 : 0)
    + (filtresAlertes.estEnAlerteÉcart ? 1 : 0)
    + (filtresAlertes.estEnAlerteBaisseOuStagnation ? 1 : 0)
    + (filtresAlertes.estEnAlerteDonnéesNonMàj ? 1 : 0)
    + (filtresAlertes.estEnAlerteMétéoNonRenseignée ? 1 : 0);


  const {
    chantiersFiltrés,
    donnéesTableauChantiers,
    remontéesAlertes,
    aDesDroitsDeLectureSurAuMoinsUnChantierBrouillon,
  } = usePageChantiers(chantiers, territoireCode, filtresComptesCalculés, avancementsAgrégés);

  return (
    <PageChantiersStyled>
      {
        nombreFiltresActifs > 0 ? (
          <FiltresActifs
            axes={axes}
            ministères={ministères}
          />
        ) : null
      }
      <div className='fr-py-2w fr-px-md-2w fr-container--fluid'>
        <div className='fr-mb-2w titre flex align-center'>
          <Titre
            baliseHtml='h1'
            className='fr-h4 fr-px-2w fr-px-md-0 fr-mb-0'
          >
            {`${chantiersFiltrés.length} ${chantiersFiltrés.length >= 2 ? 'chantiers' : 'chantier'}`}
          </Titre>
          <div className='titre-liens'>
            {
              process.env.NEXT_PUBLIC_FF_FICHE_TERRITORIALE === 'true' && estAutoriséAConsulterLaFicheTerritoriale(session?.profil || '') && (
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
              )
            }
            {
              process.env.NEXT_PUBLIC_FF_RAPPORT_DETAILLE === 'true' &&
              <div>
                <Link
                  className='fr-btn fr-btn--tertiary-no-outline fr-icon-article-line fr-btn--icon-left fr-text--sm fr-px-1w fr-px-md-2w'
                  href={`/rapport-detaille?territoireCode=${territoireCode}`}
                  title='Voir le rapport détaillé'
                >
                  Voir le rapport détaillé
                </Link>
              </div>
            }
            {
              process.env.NEXT_PUBLIC_FF_EXPORT_CSV === 'true' &&
              <div>
                <button
                  aria-controls={ID_HTML_MODALE_EXPORT}
                  className='fr-btn fr-btn--tertiary-no-outline fr-icon-download-line fr-btn--icon-left fr-text--sm fr-px-1w fr-px-md-2w'
                  data-fr-opened='false'
                  type='button'
                >
                  Exporter les données
                </button>
                <ExportDesDonnées />
              </div>
            }
          </div>
        </div>
        <div className='fr-grid-row'>
          <div className='fr-col-12 fr-col-lg-7 fr-col-xl-6 fr-pr-1w'>
            <Bloc contenuClassesSupplémentaires='fr-p-1w fr-p-lg-2w'>
              <section>
                <div className='fr-container fr-p-0'>
                  <div className='fr-grid-row fr-mb-2w'>
                    <div className='fr-col-12 fr-col-xl-6 flex flex-column border-xl-r align-center'>
                      <TitreInfobulleConteneur>
                        <Titre
                          baliseHtml='h2'
                          className='fr-text--md fr-mb-0 fr-py-1v'
                          estInline
                        >
                          Taux d’avancement moyen
                        </Titre>
                        <Infobulle idHtml='infobulle-chantiers-jauges'>
                          {INFOBULLE_CONTENUS.chantiers.jauges}
                        </Infobulle>
                      </TitreInfobulleConteneur>
                      <div className='flex w-full justify-center fr-px-1w'>
                        <JaugeDeProgression
                          couleur='bleu'
                          libellé="Taux d'avancement global"
                          pourcentage={avancementsAgrégés?.global.moyenne || null}
                          taille='lg'
                        />
                      </div>
                    </div>
                    <div className='fr-col-12 fr-col-xl-6'>
                      <div className='fr-container fr-px-1w'>
                        <div className='fr-grid-row fr-grid-row--center texte-centre fr-py-1w fr-text--sm'>
                          Répartition des taux d’avancement des territoires
                        </div>
                        <div className='fr-grid-row fr-grid-row-md--gutters fr-px-3v'>
                          <div className='fr-col-4'>
                            <JaugeDeProgression
                              couleur='orange'
                              libellé='Minimum'
                              noWrap
                              pourcentage={avancementsAgrégés?.global.minimum || null}
                              taille='sm'
                            />
                          </div>
                          <div className='fr-col-4'>
                            <JaugeDeProgression
                              couleur='violet'
                              libellé='Médiane'
                              noWrap
                              pourcentage={avancementsAgrégés?.global.médiane || null}
                              taille='sm'
                            />
                          </div>
                          <div className='fr-col-4'>
                            <JaugeDeProgression
                              couleur='vert'
                              libellé='Maximum'
                              noWrap
                              pourcentage={avancementsAgrégés?.global.maximum || null}
                              taille='sm'
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className='fr-grid-row border-t'>
                    <div className='fr-mt-2w w-full'>
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
                      <p className='fr-text--xs fr-mb-0 fr-mt-1v'>
                        Moyenne de l'année en cours
                      </p>
                    </div>
                  </div>
                </div>
              </section>
              <hr className='fr-hr fr-mt-3w fr-mb-3v fr-pb-1v' />
              <section className='fr-mx-2w'>
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
                <RépartitionMétéo météos={répartitionMétéos} />
              </section>
            </Bloc>
          </div>
          <div className='fr-col-12 fr-col-lg-5 fr-col-xl-6 fr-pl-1w'>
            <Bloc>
              <section>
                <Titre
                  baliseHtml='h2'
                  className='fr-text--lg break-keep'
                >
                  Taux d’avancement des chantiers par territoire
                </Titre>
                <CartographieAvancement
                  auClicTerritoireCallback={auClicTerritoireCallback}
                  données={avancementsGlobauxTerritoriauxMoyens}
                  mailleSelectionnee={mailleSelectionnee}
                  territoireCode={territoireCode}
                  élémentsDeLégende={ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS}
                />
              </section>
            </Bloc>
          </div>
        </div>
        {
          process.env.NEXT_PUBLIC_FF_ALERTES === 'true' &&
          <div className='fr-pt-3w fr-px-2w fr-px-md-0 alertes'>
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
                  (process.env.NEXT_PUBLIC_FF_ALERTES_BAISSE === 'true' || nomCritère !== 'estEnAlerteBaisseOuStagnation') &&
                  <div
                    className='fr-col fr-px-1v fr-px-md-1w'
                    key={libellé}
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
          <div className='fr-col'>
            <Bloc>
              <TitreInfobulleConteneur>
                <Titre
                  baliseHtml='h2'
                  className='fr-text--lg fr-mb-0 fr-py-1v'
                  estInline
                >
                  {`Liste des chantiers (${chantiers.length})`}
                </Titre>
                <Infobulle idHtml='infobulle-chantiers-listeDesChantiers'>
                  {INFOBULLE_CONTENUS.chantiers.listeDesChantiers}
                </Infobulle>
              </TitreInfobulleConteneur>
              {
                !!session?.profilAAccèsAuxChantiersBrouillons && (!brouillon || aDesDroitsDeLectureSurAuMoinsUnChantierBrouillon(session.habilitations.lecture.chantiers))
                  ? (
                    <div className='fr-grid-row fr-my-2w fr-mb-md-0'>
                      <SélecteurVueStatuts />
                    </div>
                  )
                  : null
              }
              <TableauChantiers
                données={donnéesTableauChantiers}
                ministèresDisponibles={ministères}
              />
            </Bloc>
          </div>
        </div>
      </div>
    </PageChantiersStyled>
  );
};

export default PageChantiers;
