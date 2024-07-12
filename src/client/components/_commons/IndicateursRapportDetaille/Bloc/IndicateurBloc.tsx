import { FunctionComponent } from 'react';
import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import Tableau from '@/components/_commons/Tableau/Tableau';
import PictoBaromètre from '@/components/_commons/PictoBaromètre/PictoBaromètre';
import IndicateurDétails from '@/components/_commons/IndicateursRapportDetaille/Bloc/Détails/IndicateurDétails';
import IndicateurBlocProps, {
  IndicateurDétailsParTerritoire,
} from '@/components/_commons/IndicateursRapportDetaille/Bloc/IndicateurBloc.interface';
import { actionsTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import {
  IndicateurPondération,
} from '@/components/_commons/IndicateursRapportDetaille/Bloc/Pondération/IndicateurPondération';
import IndicateurTendance from '@/client/components/_commons/IndicateursRapportDetaille/Bloc/Tendance/IndicateurTendance';
import SousIndicateurs from '@/client/components/_commons/IndicateursRapportDetaille/SousIndicateurs';
import IndicateurBlocStyled from './IndicateurBloc.styled';
import useIndicateurBloc from './useIndicateurBloc';

const IndicateurBloc: FunctionComponent<IndicateurBlocProps> = ({
  indicateur,
  détailsIndicateurs,
  estInteractif,
  territoireProjetStructurant,
  territoireCode,
  typeDeRéforme,
  chantierEstTerritorialisé,
  listeSousIndicateurs,
}) => {
  const { récupérerDétailsSurUnTerritoire } = actionsTerritoiresStore();

  const détailsIndicateur = détailsIndicateurs[indicateur.id];
  const territoireSélectionné = récupérerDétailsSurUnTerritoire(territoireCode);
  const {
    indicateurDétailsParTerritoires,
    tableau,
    dateDeMiseAJourIndicateur,
  } = useIndicateurBloc(détailsIndicateur, typeDeRéforme, territoireSélectionné, territoireProjetStructurant);

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
                    {dateDeMiseAJourIndicateur}
                  </span>
                </p>
                {
                  !!territoireSélectionné && !!détailsIndicateur[territoireSélectionné.codeInsee] ? (
                    <IndicateurPondération
                      indicateurPondération={détailsIndicateur[territoireSélectionné.codeInsee]?.pondération ?? null}
                      mailleSélectionnée={territoireSélectionné.maille}
                    />
                  ) : null
                }
                {
                  territoireSélectionné && détailsIndicateur[territoireSélectionné.codeInsee]?.tendance === 'BAISSE' ? (
                    <IndicateurTendance />
                  ) : null
                }
              </div>
            </div>
          </div>
          <Tableau<IndicateurDétailsParTerritoire>
            tableau={tableau}
            titre={`Tableau de l'indicateur : ${indicateur.nom}`}
          />
          {
            estInteractif ? (
              <IndicateurDétails
                chantierEstTerritorialisé={chantierEstTerritorialisé}
                dateDeMiseAJourIndicateur={dateDeMiseAJourIndicateur}
                indicateur={indicateur}
                indicateurDétailsParTerritoires={indicateurDétailsParTerritoires}
                typeDeRéforme={typeDeRéforme}
              />
            ) : (
              <SousIndicateurs
                chantierEstTerritorialisé={chantierEstTerritorialisé}
                détailsIndicateurs={détailsIndicateurs}
                estInteractif={estInteractif}
                listeSousIndicateurs={listeSousIndicateurs}
              />
            )
          }
        </section>
      </Bloc>
    </IndicateurBlocStyled>
  );
};

export default IndicateurBloc;
