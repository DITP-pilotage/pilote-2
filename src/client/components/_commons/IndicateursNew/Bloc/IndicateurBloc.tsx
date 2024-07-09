import { useState } from 'react';
import { useRouter } from 'next/router';
import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import Tableau from '@/components/_commons/Tableau/Tableau';
import PictoBaromètre from '@/components/_commons/PictoBaromètre/PictoBaromètre';
import IndicateurDétails from '@/components/_commons/IndicateursNew/Bloc/Détails/IndicateurDétails';
import IndicateurBlocProps, {
  IndicateurDétailsParTerritoire,
} from '@/components/_commons/IndicateursNew/Bloc/IndicateurBloc.interface';
import FormulaireIndicateur
  from '@/components/PageImportIndicateur/PageImportIndicateurSectionImport/FormulaireIndicateur/FormulaireIndicateur';
import { DetailValidationFichierContrat } from '@/server/app/contrats/DetailValidationFichierContrat.interface';
import ResultatValidationFichier
  from '@/components/PageImportIndicateur/ResultatValidationFichier/ResultatValidationFichier';
import { actionsTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import { IndicateurPondération } from '@/components/_commons/IndicateursNew/Bloc/Pondération/IndicateurPondération';
import IndicateurBlocStyled from './IndicateurBloc.styled';
import useIndicateurBloc from './useIndicateurBloc';

export default function IndicateurBloc({
  indicateur,
  détailsIndicateur,
  estInteractif,
  territoireProjetStructurant,
  territoireCode,
  typeDeRéforme,
  chantierEstTerritorialisé,
  estDisponibleALImport = false,
}: IndicateurBlocProps) {
  const router = useRouter();
  const réformeId = router.query.id as string;
  const { récupérerDétailsSurUnTerritoire } = actionsTerritoiresStore();

  const territoireSélectionné = récupérerDétailsSurUnTerritoire(territoireCode);
  const {
    indicateurDétailsParTerritoires,
    tableau,
    dateDeMiseAJourIndicateur,
  } = useIndicateurBloc(détailsIndicateur, typeDeRéforme, territoireSélectionné, territoireProjetStructurant);
  const [rapport, setRapport] = useState<DetailValidationFichierContrat | null>(null);

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
              </div>
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
}
