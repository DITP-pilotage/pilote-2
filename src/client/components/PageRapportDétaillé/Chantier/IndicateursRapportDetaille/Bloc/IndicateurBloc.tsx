import { FunctionComponent } from 'react';
import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import Tableau from '@/components/_commons/Tableau/Tableau';
import PictoBaromètre from '@/components/_commons/PictoBaromètre/PictoBaromètre';
import {
  IndicateurDétailsParTerritoire,
} from '@/components/PageRapportDétaillé/Chantier/IndicateursRapportDetaille/Bloc/IndicateurBloc.interface';
import { actionsTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import IndicateurPondération
  from '@/components/PageRapportDétaillé/Chantier/IndicateursRapportDetaille/Bloc/Pondération/IndicateurPondération';
import IndicateurTendance
  from '@/components/PageRapportDétaillé/Chantier/IndicateursRapportDetaille/Bloc/Tendance/IndicateurTendance';
import { TypeDeRéforme } from '@/client/stores/useTypeDeRéformeStore/useTypedeRéformeStore.interface';
import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';
import useIndicateurBloc from './useIndicateurBloc';
import IndicateurBlocStyled from './IndicateurBloc.styled';
import SousIndicateursRapportDetaille from './SousIndicateursRapportDetaille/SousIndicateursRapportDetaille';

interface IndicateurBlocProps {
  indicateur: Indicateur
  détailsIndicateurs: DétailsIndicateurs
  territoireProjetStructurant?: ProjetStructurant['territoire']
  territoireCode: string
  typeDeRéforme: TypeDeRéforme
  listeSousIndicateurs: Indicateur[]
}

const IndicateurBloc: FunctionComponent<IndicateurBlocProps> = ({
  indicateur,
  détailsIndicateurs,
  territoireProjetStructurant,
  territoireCode,
  typeDeRéforme,
  listeSousIndicateurs,
}) => {
  const { récupérerDétailsSurUnTerritoire } = actionsTerritoiresStore();

  const détailsIndicateur = détailsIndicateurs[indicateur.id];
  const territoireSélectionné = récupérerDétailsSurUnTerritoire(territoireCode);
  const {
    tableau,
    dateDeMiseAJourIndicateur,
  } = useIndicateurBloc(détailsIndicateur, typeDeRéforme, territoireSélectionné, territoireProjetStructurant);

  return (
    <IndicateurBlocStyled
      className='fr-mb-2w impression-section'
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
                  Dernière mise à jour des données (de l’indicateur, toutes zones confondues) :
                  {' '}
                  <span className='fr-text--bold'>
                    {dateDeMiseAJourIndicateur}
                  </span>
                </p>
                <IndicateurPondération
                  indicateurPondération={détailsIndicateur[territoireSélectionné.codeInsee].pondération ?? null}
                  mailleSélectionnée={territoireSélectionné.maille}
                />
                {
                  détailsIndicateur[territoireSélectionné.codeInsee].tendance === 'BAISSE' ? (
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
          <SousIndicateursRapportDetaille
            détailsIndicateurs={détailsIndicateurs}
            listeSousIndicateurs={listeSousIndicateurs}
            territoireCode={territoireCode}
          />
        </section>
      </Bloc>
    </IndicateurBlocStyled>
  );
};

export default IndicateurBloc;
