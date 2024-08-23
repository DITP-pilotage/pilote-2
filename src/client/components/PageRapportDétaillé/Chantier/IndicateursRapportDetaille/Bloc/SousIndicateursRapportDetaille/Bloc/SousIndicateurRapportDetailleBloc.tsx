import { FunctionComponent } from 'react';
import Titre from '@/components/_commons/Titre/Titre';
import Tableau from '@/components/_commons/Tableau/Tableau';
import PictoBaromètre from '@/components/_commons/PictoBaromètre/PictoBaromètre';
import { territoireCodeVersMailleCodeInsee } from '@/server/utils/territoires';
import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import IndicateurPonderation from '@/components/_commons/IndicateursChantier/Bloc/Pondération/IndicateurPonderation';
import BadgeIcône from '@/components/_commons/BadgeIcône/BadgeIcône';
import {
  IndicateurDétailsParTerritoire,
} from '@/components/_commons/IndicateursChantier/Bloc/IndicateurBloc.interface';
import PictoSousIndicateur from '@/components/_commons/PictoSousIndicateur/PictoSousIndicateur';
import useIndicateurAlerteDateMaj from '@/components/_commons/IndicateursChantier/Bloc/useIndicateurAlerteDateMaj';
import IndicateurTendance from '@/components/_commons/IndicateursChantier/Bloc/Tendances/IndicateurTendance';
import useSousIndicateurBloc from './useSousIndicateurRapportDetailleBloc';
import '@gouvfr/dsfr/dist/utility/colors/colors.css';
import SousIndicateurRapportDetailleBlocStyled from './SousIndicateurBlocRapportDetaille.styled';

interface SousIndicateurBlocProps {
  indicateur: Indicateur
  détailsIndicateurs: DétailsIndicateurs
  classeCouleurFond: string
  territoireCode: string
}

const SousIndicateurRapportDetailleBloc: FunctionComponent<SousIndicateurBlocProps> = ({
  indicateur,
  détailsIndicateurs,
  classeCouleurFond,
  territoireCode,
}) => {
  const détailsIndicateur = détailsIndicateurs[indicateur.id];

  const { maille, codeInsee } = territoireCodeVersMailleCodeInsee(territoireCode);

  const {
    tableau,
    dateDeMiseAJourIndicateur,
    dateProchaineDateMaj,
    indicateurNonAJour,
  } = useSousIndicateurBloc(détailsIndicateur, territoireCode);

  const { estIndicateurEnAlerte } = useIndicateurAlerteDateMaj(indicateurNonAJour);

  return (
    <SousIndicateurRapportDetailleBlocStyled
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
                ) : null
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
        </div>
        <Tableau<IndicateurDétailsParTerritoire>
          tableau={tableau}
          titre={`Tableau de l'indicateur : ${indicateur.nom}`}
        />
      </section>
    </SousIndicateurRapportDetailleBlocStyled>
  );
};

export default SousIndicateurRapportDetailleBloc;
