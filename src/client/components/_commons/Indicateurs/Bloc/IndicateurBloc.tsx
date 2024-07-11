import { FunctionComponent, useState } from 'react';
import { useRouter } from 'next/router';
import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import Tableau from '@/components/_commons/Tableau/Tableau';
import PictoBaromètre from '@/components/_commons/PictoBaromètre/PictoBaromètre';
import IndicateurDétails from '@/components/_commons/Indicateurs/Bloc/Détails/IndicateurDétails';
import IndicateurBlocProps, {
  IndicateurDétailsParTerritoire,
} from '@/components/_commons/Indicateurs/Bloc/IndicateurBloc.interface';
import FormulaireIndicateur
  from '@/components/PageImportIndicateur/PageImportIndicateurSectionImport/FormulaireIndicateur/FormulaireIndicateur';
import { DetailValidationFichierContrat } from '@/server/app/contrats/DetailValidationFichierContrat.interface';
import ResultatValidationFichier
  from '@/components/PageImportIndicateur/ResultatValidationFichier/ResultatValidationFichier';
import { territoireSélectionnéTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import { IndicateurPonderation } from '@/components/_commons/Indicateurs/Bloc/Pondération/IndicateurPonderation';
import BadgeIcône from '@/components/_commons/BadgeIcône/BadgeIcône';
import IndicateurBlocStyled from './IndicateurBloc.styled';
import useIndicateurBloc from './useIndicateurBloc';
import useIndicateurAlerteDateMaj from './useIndicateurAlerteDateMaj';
import IndicateurTendance from './Tendances/IndicateurTendance';

const IndicateurBloc: FunctionComponent<IndicateurBlocProps> = ({
  indicateur,
  détailsIndicateurs,
  estInteractif,
  territoireProjetStructurant,
  typeDeRéforme,
  chantierEstTerritorialisé,
  estDisponibleALImport = false,
  listeSousIndicateurs,
}: IndicateurBlocProps) {
  const router = useRouter();
  const réformeId = router.query.id as string;

  const détailsIndicateur = détailsIndicateurs[indicateur.id];
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  const {
    indicateurDétailsParTerritoires,
    tableau,
    dateDeMiseAJourIndicateur,
    dateProchaineDateMaj,
  } = useIndicateurBloc(détailsIndicateur, typeDeRéforme, territoireProjetStructurant);
  const [rapport, setRapport] = useState<DetailValidationFichierContrat | null>(null);

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
              { 
                territoireSélectionné && détailsIndicateur[territoireSélectionné.codeInsee]?.tendance === 'BAISSE' ? (
                  <IndicateurTendance />
                ) : null
              }
            </div>
            {
              estDisponibleALImport ? (
                <FormulaireIndicateur
                  chantierId={réformeId}
                  indicateurId={indicateur.id}
                  setRapport={setRapport}
                />
              )
                : null
            }
          </div>
          {
            rapport !== null &&
            <ResultatValidationFichier rapport={rapport} />
          }
          <Tableau<IndicateurDétailsParTerritoire>
            tableau={tableau}
            titre={`Tableau de l'indicateur : ${indicateur.nom}`}
          />
          {
            estInteractif ? (
              <IndicateurDétails
                chantierEstTerritorialisé={chantierEstTerritorialisé}
                dateDeMiseAJourIndicateur={dateDeMiseAJourIndicateur}
                détailsIndicateurs={détailsIndicateurs}
                indicateur={indicateur}
                indicateurDétailsParTerritoires={indicateurDétailsParTerritoires}
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
