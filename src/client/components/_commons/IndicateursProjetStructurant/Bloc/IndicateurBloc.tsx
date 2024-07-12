import { FunctionComponent } from 'react';
import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import Tableau from '@/components/_commons/Tableau/Tableau';
import PictoBaromètre from '@/components/_commons/PictoBaromètre/PictoBaromètre';
import IndicateurDétails from '@/components/_commons/IndicateursProjetStructurant/Bloc/Détails/IndicateurDétails';
import IndicateurBlocProps, {
  IndicateurDétailsParTerritoire,
} from '@/components/_commons/IndicateursProjetStructurant/Bloc/IndicateurBloc.interface';
import { territoireSélectionnéTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import {
  IndicateurPonderation,
} from '@/components/_commons/IndicateursProjetStructurant/Bloc/Pondération/IndicateurPonderation';
import BadgeIcône from '@/components/_commons/BadgeIcône/BadgeIcône';
import IndicateurBlocStyled from './IndicateurBloc.styled';
import useIndicateurBloc from './useIndicateurBloc';
import useIndicateurAlerteDateMaj from './useIndicateurAlerteDateMaj';
import IndicateurTendance from './Tendances/IndicateurTendance';
import '@gouvfr/dsfr/dist/component/table/table.min.css';


const IndicateurBloc: FunctionComponent<IndicateurBlocProps> = ({
  indicateur,
  détailsIndicateurs,
  estInteractif,
  territoireProjetStructurant,
  typeDeRéforme,
  chantierEstTerritorialisé,
  listeSousIndicateurs,
}: IndicateurBlocProps) => {
  const détailsIndicateur = détailsIndicateurs[indicateur.id];
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();

  const {
    indicateurDétailsParTerritoires,
    tableau,
    dateDeMiseAJourIndicateur,
    dateProchaineDateMaj,
  } = useIndicateurBloc(détailsIndicateur, typeDeRéforme, territoireProjetStructurant);

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
          </div>
          <Tableau<IndicateurDétailsParTerritoire>
            tableau={tableau}
            titre={`Tableau de l'indicateur : ${indicateur.nom}`}
          />
          <table className='fr-table w-full border-collapse'>
            <caption className='fr-sr-only'>
              Un tableau de l'indicateur :'
            </caption>
            <thead className='fr-background-action-low-blue-france'>
              <tr>
                <th className='fr-mb-0 fr-px-2w fr-p-1w fr-py-md-1w fr-text--sm fr-text--bold'>
                  Territoire(s)
                </th>
                <th className='fr-mb-0 fr-px-0 fr-p-1w fr-py-md-1w fr-text--sm fr-text--bold'>
                  Valeur initiale
                </th>
                <th className='fr-mb-0 fr-px-0 fr-p-1w fr-py-md-1w fr-text--sm fr-text--bold'>
                  Valeur actuelle
                </th>
                <th className='fr-mb-0 fr-px-0 fr-p-1w fr-py-md-1w fr-text--sm fr-text--bold'>
                  Cible 2024
                </th>
                <th className='fr-mb-0 fr-px-0 fr-p-1w fr-py-md-1w fr-text--sm fr-text--bold'>
                  Avancement 2024
                </th>
                <th className='fr-mb-0 fr-px-0 fr-p-1w fr-py-md-1w fr-text--sm fr-text--bold'>
                  Cible 2026
                </th>
                <th className='fr-mb-0 fr-px-0 fr-p-1w fr-py-md-1w fr-text--sm fr-text--bold'>
                  Avancement 2026
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className='fr-mb-0 fr-px-2w fr-p-1w fr-py-md-1w fr-text--sm'>
                  Test1
                </td>
                <td className='fr-mb-0 fr-px-0 fr-p-1w fr-py-md-1w fr-text--sm'>
                  Test1
                </td>
                <td className='fr-mb-0 fr-px-0 fr-p-1w fr-py-md-1w fr-text--sm'>
                  Test1
                </td>
                <td className='fr-mb-0 fr-px-0 fr-p-1w fr-py-md-1w fr-text--sm'>
                  Test1
                </td>
                <td className='fr-mb-0 fr-px-0 fr-p-1w fr-py-md-1w fr-text--sm'>
                  Test1
                </td>
                <td className='fr-mb-0 fr-px-0 fr-p-1w fr-py-md-1w fr-text--sm'>
                  Test1
                </td>
                <td className='fr-mb-0 fr-px-0 fr-p-1w fr-py-md-1w fr-text--sm'>
                  Test1
                </td>
              </tr>
            </tbody>
          </table>
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
