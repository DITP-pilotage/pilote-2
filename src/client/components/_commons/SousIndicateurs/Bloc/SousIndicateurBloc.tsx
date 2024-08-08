import { useState } from 'react';
import { useRouter } from 'next/router';
import Titre from '@/components/_commons/Titre/Titre';
import Tableau from '@/components/_commons/Tableau/Tableau';
import PictoBaromètre from '@/components/_commons/PictoBaromètre/PictoBaromètre';
import IndicateurDétails from '@/components/_commons/IndicateursChantier/Bloc/Détails/IndicateurDétails';
import FormulaireIndicateur
  from '@/components/PageImportIndicateur/PageImportIndicateurSectionImport/FormulaireIndicateur/FormulaireIndicateur';
import { territoireCodeVersMailleCodeInsee } from '@/server/utils/territoires';
import { DetailValidationFichierContrat } from '@/server/app/contrats/DetailValidationFichierContrat.interface';
import ResultatValidationFichier
  from '@/components/PageImportIndicateur/ResultatValidationFichier/ResultatValidationFichier';
import {
  IndicateurPonderation,
} from '@/components/_commons/IndicateursChantier/Bloc/Pondération/IndicateurPonderation';
import BadgeIcône from '@/components/_commons/BadgeIcône/BadgeIcône';
import {
  IndicateurDétailsParTerritoire,
} from '@/components/_commons/IndicateursChantier/Bloc/IndicateurBloc.interface';
import PictoSousIndicateur from '@/components/_commons/PictoSousIndicateur/PictoSousIndicateur';
import useIndicateurAlerteDateMaj from '@/components/_commons/IndicateursChantier/Bloc/useIndicateurAlerteDateMaj';
import IndicateurTendance from '@/components/_commons/IndicateursChantier/Bloc/Tendances/IndicateurTendance';
import useSousIndicateurBloc from './useSousIndicateurBloc';
import SousIndicateurBlocProps from './SousIndicateurBloc.interface';
import SousIndicateurBlocStyled from './SousIndicateurBloc.styled';
import '@gouvfr/dsfr/dist/utility/colors/colors.css';

export default function SousIndicateurBloc({
  indicateur,
  détailsIndicateurs,
  detailsIndicateursTerritoire,
  estInteractif,
  chantierEstTerritorialisé,
  estDisponibleALImport = false,
  classeCouleurFond,
  territoireCode,
  mailleSelectionnee,
}: SousIndicateurBlocProps) {
  const router = useRouter();
  const réformeId = router.query.id as string;

  const détailsIndicateur = détailsIndicateurs[indicateur.id];

  const { maille, codeInsee } = territoireCodeVersMailleCodeInsee(territoireCode);

  const {
    indicateurDétailsParTerritoires,
    tableau,
    dateDeMiseAJourIndicateur,
    dateProchaineDateMaj,
    dateProchaineDateValeurActuelle,
    dateValeurActuelle,
  } = useSousIndicateurBloc(détailsIndicateur);
  const [rapport, setRapport] = useState<DetailValidationFichierContrat | null>(null);

  const { estIndicateurEnAlerte } = useIndicateurAlerteDateMaj(détailsIndicateur, codeInsee);

  return (
    <SousIndicateurBlocStyled
      className={`fr-pt-1w ${classeCouleurFond}`}
      key={indicateur.id}
    >
      <section>
        <div className='flex justify-between'>
          <div>
            <Titre
              baliseHtml='h4'
              className='fr-text--xl fr-mb-1w fr-ml-1w'
            >
              <span className='fr-mr-1v'>
                <PictoSousIndicateur />
              </span>
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
              <p className='fr-mb-0 fr-text--xs texte-gris'>
                Dernière mise à jour des données (de l'indicateur) :
                {' '}
                <span className='fr-text--bold'>
                  {dateDeMiseAJourIndicateur ?? 'Non renseignée'}
                </span>
              </p>
              {
                !!détailsIndicateur[codeInsee] ? (
                  <p
                    className={`fr-mb-0 fr-text--xs${estIndicateurEnAlerte ? ' fr-text-warning' : ''}`}
                  >
                    Date prévisionnelle de la prochaine date de mise à jour des données (de l'indicateur) :
                    {' '}
                    <span className='fr-text--bold'>
                      {dateProchaineDateMaj ?? 'Non renseignée'}
                    </span>
                  </p>
                ) : null
              }
              {
                !!détailsIndicateur[codeInsee] ? (
                  <IndicateurPonderation
                    indicateurPondération={détailsIndicateur[codeInsee]?.pondération ?? null}
                    mailleSélectionnée={maille}
                  />
                ) : null
              }
            </div>
            {
              détailsIndicateur[codeInsee]?.tendance === 'BAISSE' ? (
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
              dateProchaineDateMaj={dateProchaineDateMaj}
              dateProchaineDateValeurActuelle={dateProchaineDateValeurActuelle}
              dateValeurActuelle={dateValeurActuelle}
              detailsIndicateursTerritoire={detailsIndicateursTerritoire}
              détailsIndicateurs={détailsIndicateurs}
              estSousIndicateur
              indicateur={indicateur}
              indicateurDétailsParTerritoires={indicateurDétailsParTerritoires}
              listeSousIndicateurs={[]}
              mailleSelectionnee={mailleSelectionnee}
              territoireCode={territoireCode}
            />
          ) : null
        }
      </section>
    </SousIndicateurBlocStyled>
  );
}
