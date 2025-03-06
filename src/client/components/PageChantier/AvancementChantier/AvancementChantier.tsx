/* eslint-disable react/jsx-child-element-spacing */
import { FunctionComponent } from 'react';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import Bloc from '@/components/_commons/Bloc/Bloc';
import { actionsTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import AvancementsTerritoire from '@/components/_commons/AvancementsTerritoire/AvancementsTerritoire';
import JaugeDeProgression from '@/components/_commons/JaugeDeProgression/JaugeDeProgression';
import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import { AvancementsStatistiques } from '@/components/_commons/Avancements/Avancements.interface';
import { Maille, MailleInterne } from '@/server/domain/maille/Maille.interface';
import Alerte from '@/components/_commons/Alerte/Alerte';
import SélecteurMaille
  from '@/components/_commons/SélecteursMaillesEtTerritoiresChantier/SélecteurMaille/SélecteurMaille';
import INFOBULLE_CONTENUS from '@/client/constants/infobulles';
import { JaugeDeProgressionSmall } from '@/components/_commons/JaugeDeProgressionSmall/JaugeDeProgressionSmall';
import Sélecteur from '@/components/_commons/Sélecteur/Sélecteur';
import { sauvegarderFiltres } from '@/stores/useFiltresStoreNew/useFiltresStoreNew';
import Infobulle from '@/components/_commons/Infobulle/Infobulle';
import { DonneesComparaisonDuTauxDAvancementType } from '@/server/domain/territoire/Territoire.interface';
import AvancementChantierStyled from './AvancementChantier.styled';
import EcartTauxAvancementPPG from './EcartTauxAvancementPPG/EcartTauxAvancementPPG';
import TendanceTauxAvancementPPG from './TendanceTauxAvancementPPG/TendanceTauxAvancementPPG';

const classeÀPartirDeLaMaille = {
  'nationale': 'layout--nat',
  'departementale': 'layout--dept',
  'regionale': 'layout--reg',
};

interface AvancementChantierProps {
  territoireCode: string
  mailleSelectionnee: MailleInterne
  jalon: number
  mailleQuery: MailleInterne
  estAutoriseAVoirLeSelecteurDeMaille: boolean
  avancements: {
    nationale: AvancementsStatistiques
    departementale: {
      global: {
        moyenne: number | null
      },
      annuel: {
        moyenne: number | null
      },
    }
    regionale: {
      global: {
        moyenne: number | null
      },
      annuel: {
        moyenne: number | null
      },
    }
  }
  mailleSourceDonnees?: Maille | null
  donneesComparaisonDuTauxDAvancement: DonneesComparaisonDuTauxDAvancementType
}

const AvancementChantier: FunctionComponent<AvancementChantierProps> = ({
  avancements,
  territoireCode,
  mailleSelectionnee,
  mailleQuery,
  estAutoriseAVoirLeSelecteurDeMaille,
  mailleSourceDonnees,
  jalon,
  donneesComparaisonDuTauxDAvancement,
}) => {
  const { récupérerDétailsSurUnTerritoire } = actionsTerritoiresStore();

  const [, setJalon] = useQueryState('jalon', parseAsStringLiteral(['2024', '2025']).withDefault('2024').withOptions({
    shallow: false,
    history: 'push',
  }));

  const auClickSelecteurJalon = (valeur: '2024' | '2025') => {
    sauvegarderFiltres({ jalon: valeur });
    setJalon(valeur);
  };

  const pathname = '/chantier/[id]/[territoireCode]';

  const territoireSélectionné = récupérerDétailsSurUnTerritoire(territoireCode);
  const territoireSélectionnéParent = territoireSélectionné.codeParent ? récupérerDétailsSurUnTerritoire(territoireSélectionné.codeParent) : null;
  const sousTitreTuileAvancementDepartemental = "Taux d'avancement départemental";
  const sousTitreTuileAvancementRegional = "Taux d'avancement régional";

  return (
    <AvancementChantierStyled className={classeÀPartirDeLaMaille[territoireSélectionné.maille]}>
      {
        territoireCode !== 'NAT-FR' && mailleSelectionnee === 'departementale' ? (
          <Bloc titre={territoireSélectionné?.nomAffiché}>
            <div className='fr-py-1w jauge'>
              <AvancementsTerritoire
                avancementAnnuel={avancements.departementale.annuel.moyenne}
                avancementGlobal={avancements.departementale.global.moyenne}
                couleurBarreDeProgression='secondaire'
                couleurJaugeDeProgression='bleu'
                doitAfficherLeSelecteur={territoireCode.startsWith('DEPT')}
                jalon={jalon}
                territoireNom={territoireSélectionné.nom}
                titreTauxAvancement={sousTitreTuileAvancementDepartemental}
              />
              {
                mailleSourceDonnees === 'regionale' &&
                <Alerte
                  classesMessagePolice='fr-text fr-text--xs'
                  classesSupplementaires='fr-mt-2w'
                  message='Données régionales'
                  type='info'
                />
              }
            </div>
          </Bloc>
        ) : null
      }
      {
        territoireCode !== 'NAT-FR' && (mailleSelectionnee === 'regionale' || mailleSelectionnee === 'departementale') ? (
          <Bloc
            titre={territoireSélectionnéParent ? territoireSélectionnéParent.nomAffiché : territoireSélectionné.nomAffiché}
          >
            <div className='fr-py-1w jauge'>
              <AvancementsTerritoire
                avancementAnnuel={avancements.regionale.annuel.moyenne}
                avancementGlobal={avancements.regionale.global.moyenne}
                couleurBarreDeProgression={mailleSelectionnee === 'regionale' ? 'secondaire' : 'secondaire-light'}
                couleurJaugeDeProgression={mailleSelectionnee === 'regionale' ? 'bleu' : 'bleu-clair'}
                doitAfficherLeSelecteur={territoireCode.startsWith('REG')}
                jalon={jalon}
                territoireNom={territoireSélectionnéParent ? territoireSélectionnéParent.nomAffiché : territoireSélectionné.nomAffiché}
                titreTauxAvancement={sousTitreTuileAvancementRegional}
              />
            </div>
          </Bloc>
        ) : null
      }
      <Bloc
        titre='France'
      >
        <div className='fr-py-1w jauge'>
          <div className='flex flex-direction-column flex-wrap justify-center align-center'>
            <strong className='fr-text--sm fr-mb-0 text-center'>
              Taux d'avancement national
            </strong>
            <p className='fr-text--sm fr-ml-1v'>
              2025
            </p>   
          </div>
          <JaugeDeProgression
            couleur={territoireCode !== 'NAT-FR' ? 'bleu-clair' : 'bleu'}
            libellé='France'
            pourcentage={avancements.nationale ? avancements.nationale.global.moyenne : null}
            taille='lg'
          />
          <div className='fr-mt-2w'>
            <p className='fr-text--xl fr-text--bold fr-mb-0 texte-gris'>
              {`${(process.env.NEXT_PUBLIC_FF_TA_ANNUEL === 'true' ? avancements.nationale?.annuel.moyenne?.toFixed(0) : null) ?? '- '}%`}
            </p>
            <BarreDeProgression
              afficherTexte={false}
              bordure={null}
              fond='gris-clair'
              positionTexte='dessus'
              taille='xxs'
              valeur={!!avancements.nationale && process.env.NEXT_PUBLIC_FF_TA_ANNUEL === 'true' ? avancements.nationale.annuel.moyenne : null}
              variante='secondaire-light'
            />
            <div className='flex align-center justify-center fr-text--xs  w-full relative'>
              <p className='fr-text--xs fr-mb-0 fr-mt-1v'>
                {`Avancement à échéance${!territoireCode.startsWith('NAT') ? ` ${jalon}` : ''}`}
              </p>
              {
                territoireCode.startsWith('NAT') ? (
                  <div className='flex flex-wrap justify-center'>
                    <div
                      className='select-sm flex align-center justify-center'
                    >
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
                ) : null
              }
            </div>
          </div>
        </div>
      </Bloc>
      <Bloc
        className='h-full'
        contenuClassesSupplémentaires='fr-p-2w'
        contenuInfobulle={INFOBULLE_CONTENUS.chantiers.repartitions}
        titre="Répartition territoriale du taux d'avancement 2026"
      >
        <div className='fr-px-md-1w fr-px-lg-2w fr-py-1w'>
          {
            mailleQuery === 'regionale' ? (
              <div className='flex flex-direction-column flex-wrap justify-center align-center'>
                <strong className='fr-text--sm fr-mb-0 text-center'>
                  Répartition régionale
                </strong>
                <p className='fr-text--sm fr-ml-1v'>
                  2026
                </p>   
              </div>
            ) : (
              <div className='flex flex-direction-column flex-wrap justify-center align-center'>
                <strong className='fr-text--sm fr-mb-0 text-center'>
                  Répartition départementale
                </strong>
                <p className='fr-text--sm fr-ml-1w'>
                  2026
                </p>   
              </div>
            )
          }
          {
            estAutoriseAVoirLeSelecteurDeMaille ? (
              <SélecteurMaille
                mailleQuery={mailleQuery}
                pathname={pathname}
              />
            ) : null
          }
          <div className='flex flex-column justify-center'>
            <JaugeDeProgressionSmall
              couleur='vert'
              libellé='Maximum'
              pourcentage={avancements.nationale ? avancements.nationale.global.maximum : null}
            />
            <JaugeDeProgressionSmall
              couleur='violet'
              libellé='Médiane'
              pourcentage={avancements.nationale ? avancements.nationale.global.médiane : null}
            />
            <JaugeDeProgressionSmall
              couleur='orange'
              libellé='Minimum'
              pourcentage={avancements.nationale ? avancements.nationale.global.minimum : null}
            />
          </div>
        </div>
      </Bloc>
      <Bloc
        className='h-full'
        contenuClassesSupplémentaires='fr-p-2w'
        contenuInfobulle={INFOBULLE_CONTENUS.chantiers.repartitions}
        titre="Données de comparaison de l'avancement 2026"
      >
        {
          territoireCode !== 'NAT-FR' ? (
            <>
              <div className='flex flex-direction-column flex-wrap justify-center align-center'>
                {
                  mailleSelectionnee === 'regionale' ? (
                    <div className='flex flex-direction-column flex-wrap justify-center align-center'>
                      <strong className='fr-text--xs fr-mb-0 text-center'>
                        SITUATION PAR RAPPORT AUX AUTRES REGIONS
                      </strong>
                      <p className='fr-text--sm fr-ml-1v fr-mb-1w'>
                        2026
                      </p>
                      <EcartTauxAvancementPPG ecart={donneesComparaisonDuTauxDAvancement.ppgEcartMedian} />
                      <p className='fr-text--xs fr-mt-1w text-center jauge-tracé'>
                        <strong className='fr-mr-1v'>
                          écart
                        </strong>
                        du taux d'avancement 2026 par rapport au taux médian des autres régions (
                        {
                          avancements.nationale && avancements.nationale.global.médiane ? (
                            <strong className='ecart-pourcentage-couleur'>
                              {avancements.nationale.global.médiane.toFixed(0) + '%'}
                            </strong>
                          ) : (
                            <strong className='ecart-pourcentage-couleur'>
                              Non défini
                            </strong>
                          )
                        }
                        ) 
                      </p>
                    </div>
                  ) : (
                    <div className='flex flex-direction-column flex-wrap justify-center align-center'>
                      <strong className='fr-text--xs fr-mb-0 text-center'>
                        SITUATION PAR RAPPORT AUX AUTRES DEPARTEMENTS
                      </strong>
                      <p className='fr-text--sm fr-ml-1v fr-mb-1w'>
                        2026
                      </p>
                      <EcartTauxAvancementPPG ecart={donneesComparaisonDuTauxDAvancement.ppgEcartMedian} />
                      <p className='fr-text--xs fr-mt-1w text-center'>
                        <strong className='fr-mr-1v'>
                          écart
                        </strong>
                        du taux d'avancement 2026 par rapport au taux médian des autres départements (
                        {
                          avancements.nationale && avancements.nationale.global.médiane ? (
                            <strong className='ecart-pourcentage-couleur'>
                              {avancements.nationale.global.médiane.toFixed(0) + '%'}
                            </strong>
                          ) : (
                            <strong className='ecart-pourcentage-couleur'>
                              Non défini
                            </strong>
                          )
                        }
                        )
                      </p>
                    </div>
                  )
                }
              </div>
              <hr className='fr-hr fr-py-1w' />
            </>
          ) : null
        }
        <div className='flex flex-direction-column flex-wrap justify-center align-center'>
          <strong className='fr-text--xs fr-mb-0 text-center'>
            EVOLUTION TEMPORELLE
          </strong>
          <p className='fr-text--sm fr-ml-1v fr-mb-1w'>
            2026
          </p>
          <TendanceTauxAvancementPPG tendance={donneesComparaisonDuTauxDAvancement.ppgTendanceChantier} />
          {
            mailleSelectionnee === 'regionale' ? (
              <p className='fr-text--xs fr-mt-1w text-center'>
                <strong className='fr-mr-1v'>
                  tendance
                </strong>
                du taux d'avancement 2026 par rapport au taux d'avancement précédemment mesuré sur la région (
                <strong className='fr-mr-1v'>
                  {donneesComparaisonDuTauxDAvancement.ppgTendanceChantier}
                </strong>
                )
              </p>   
            ) : (
              <p className='fr-text--xs fr-mt-1w text-center'>
                <strong className='fr-mr-1v'>
                  tendance
                </strong>
                du taux d'avancement 2026 par rapport au taux d'avancement précédemment mesuré sur le département (
                {
                  donneesComparaisonDuTauxDAvancement.ppgTauxDAvancementValeurPrecedente ? (
                    <strong className='fr-mr-1v tendance-pourcentage-couleur'>
                      {`${donneesComparaisonDuTauxDAvancement.ppgTauxDAvancementValeurPrecedente.toFixed(0) + '%'}`}
                    </strong>
                  ) : (
                    <strong className='tendance-pourcentage-couleur'>
                      Non défini
                    </strong>
                  )
                }
                )
              </p>   
            )          
          }
        </div>
      </Bloc>
    </AvancementChantierStyled>
  );
};

export default AvancementChantier;
