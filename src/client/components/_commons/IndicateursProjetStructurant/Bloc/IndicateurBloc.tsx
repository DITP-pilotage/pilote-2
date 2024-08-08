import { FunctionComponent } from 'react';
import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import Tableau from '@/components/_commons/Tableau/Tableau';
import PictoBaromètre from '@/components/_commons/PictoBaromètre/PictoBaromètre';
import IndicateurDétails from '@/components/_commons/IndicateursProjetStructurant/Bloc/Détails/IndicateurDétails';
import {
  IndicateurDétailsParTerritoire,
} from '@/components/_commons/IndicateursProjetStructurant/Bloc/IndicateurBloc.interface';
import { territoireSélectionnéTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import IndicateurPonderation from '@/components/_commons/IndicateursProjetStructurant/Bloc/Pondération/IndicateurPonderation';
import '@gouvfr/dsfr/dist/component/table/table.min.css';
import { TypeDeRéforme } from '@/client/stores/useTypeDeRéformeStore/useTypedeRéformeStore.interface';
import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';
import useIndicateurBloc from './useIndicateurBloc';
import IndicateurBlocStyled from './IndicateurBloc.styled';

interface IndicateurBlocProps {
  indicateur: Indicateur
  détailsIndicateurs: DétailsIndicateurs
  territoireProjetStructurant?: ProjetStructurant['territoire']
  estInteractif: boolean
  typeDeRéforme: TypeDeRéforme
  chantierEstTerritorialisé: boolean
}


const IndicateurBloc: FunctionComponent<IndicateurBlocProps> = ({
  indicateur,
  détailsIndicateurs,
  estInteractif,
  territoireProjetStructurant,
  typeDeRéforme,
  chantierEstTerritorialisé,
}: IndicateurBlocProps) => {
  const détailsIndicateur = détailsIndicateurs[indicateur.id];
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();

  const {
    indicateurDétailsParTerritoires,
    tableau,
    dateDeMiseAJourIndicateur,
    dateProchaineDateMaj,
  } = useIndicateurBloc(détailsIndicateur, typeDeRéforme, territoireProjetStructurant);

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
                      className='fr-mb-0 fr-text--xs texte-gris'
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
            ) : null
          }
        </section>
      </Bloc>
    </IndicateurBlocStyled>
  );
};

export default IndicateurBloc;
