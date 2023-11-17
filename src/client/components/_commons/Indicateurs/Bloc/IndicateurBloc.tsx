import { useState } from 'react';
import { useRouter } from 'next/router';
import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import Tableau from '@/components/_commons/Tableau/Tableau';
import PictoBaromètre from '@/components/_commons/PictoBaromètre/PictoBaromètre';
import IndicateurDétails from '@/components/_commons/Indicateurs/Bloc/Détails/IndicateurDétails';
import IndicateurBlocProps, { IndicateurDétailsParTerritoire } from '@/components/_commons/Indicateurs/Bloc/IndicateurBloc.interface';
import FormulaireIndicateur from '@/components/PageImportIndicateur/PageImportIndicateurSectionImport/FormulaireIndicateur/FormulaireIndicateur';
import { DetailValidationFichierContrat } from '@/server/app/contrats/DetailValidationFichierContrat.interface';
import ResultatValidationFichier from '@/components/PageImportIndicateur/ResultatValidationFichier/ResultatValidationFichier';
import { territoireSélectionnéTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import { IndicateurPondération } from '@/components/_commons/Indicateurs/Bloc/Pondération/IndicateurPondération';
import IndicateurBlocStyled from './IndicateurBloc.styled';
import useIndicateurBloc from './useIndicateurBloc';

export default function IndicateurBloc({ indicateur, détailsIndicateur, estInteractif, territoireProjetStructurant, typeDeRéforme, chantierEstTerritorialisé, estDisponibleALImport = false }: IndicateurBlocProps) {
  const router = useRouter();
  const réformeId = router.query.id as string;
  
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  const { indicateurDétailsParTerritoires, tableau, dateDeMiseAJourIndicateur } = useIndicateurBloc(détailsIndicateur, typeDeRéforme, territoireProjetStructurant );
  const [rapport, setRapport] = useState<DetailValidationFichierContrat | null>(null);

  return (
    <IndicateurBlocStyled
      className="fr-mb-2w"
      key={indicateur.id}
    >
      <Bloc>
        <section>
          <div className='flex justify-between'>
            <div>
              <Titre
                baliseHtml="h4"
                className="fr-text--xl fr-mb-1w"
              >
                {
                  !!indicateur.estIndicateurDuBaromètre &&
                  <span className='fr-mr-1v'>
                    <PictoBaromètre />
                  </span>
                }
                {indicateur.nom + (indicateur.unité === null ? '' : ` (en ${indicateur.unité?.toLocaleLowerCase()})`)}
              </Titre>
              <div className="fr-ml-2w fr-mb-3w">
                <p className="fr-mb-0 fr-text--xs texte-gris">
                  Dernière mise à jour des données (de l&apos;indicateur) :
                  {' '}
                  <span className="fr-text--bold">
                    {dateDeMiseAJourIndicateur}
                  </span>
                </p>
                {
                !!indicateur.pondération && !!territoireSélectionné &&
                  <IndicateurPondération
                    indicateurPondération={indicateur.pondération}
                    mailleSélectionnée={territoireSélectionné.maille}
                  />
                }
              </div>
            </div>
            {
            estDisponibleALImport ? 
              <FormulaireIndicateur
                chantierId={réformeId}
                indicateurId={indicateur.id}
                setRapport={setRapport}
              />
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
            !!estInteractif &&
              <IndicateurDétails
                chantierEstTerritorialisé={chantierEstTerritorialisé}
                dateDeMiseAJourIndicateur={dateDeMiseAJourIndicateur}
                indicateur={indicateur}
                indicateurDétailsParTerritoires={indicateurDétailsParTerritoires}
                typeDeRéforme={typeDeRéforme}
              />
          }
        </section>
      </Bloc>
    </IndicateurBlocStyled>
  );
}
