import { useState } from 'react';
import { useRouter } from 'next/router';
import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import Tableau from '@/components/_commons/Tableau/Tableau';
import PictoBaromètre from '@/components/_commons/PictoBaromètre/PictoBaromètre';
import IndicateurDétails from '@/components/PageChantier/Indicateurs/Bloc/Détails/IndicateurDétails';
import IndicateurBlocProps, { IndicateurDétailsParTerritoire } from '@/components/PageChantier/Indicateurs/Bloc/IndicateurBloc.interface';
import FormulaireIndicateur from '@/components/PageImportIndicateur/PageImportIndicateurSectionImport/FormulaireIndicateur/FormulaireIndicateur';
import { DetailValidationFichierContrat } from '@/server/app/contrats/DetailValidationFichierContrat.interface';
import ResultatValidationFichier from '@/components/PageImportIndicateur/ResultatValidationFichier/ResultatValidationFichier';
import IndicateurBlocStyled from './IndicateurBloc.styled';
import useIndicateurs from './useIndicateurBloc';

export default function IndicateurBloc({ indicateur, détailsIndicateur, estDisponibleALImport = false, estInteractif } : IndicateurBlocProps) {
  const router = useRouter();
  const chantierId = router.query.chantierId  as string;
  const { indicateurDétailsParTerritoires, colonnes } = useIndicateurs(détailsIndicateur);
  const [rapport, setRapport] = useState<DetailValidationFichierContrat | null>(null);

  return (
    <IndicateurBlocStyled
      className="fr-mb-2w"
      key={indicateur.id}
    >
      <Bloc>
        <section>
          <div className='flex justifyBetween'>
            <div>
              <Titre
                baliseHtml="h4"
                className="fr-text--xl fr-mb-1w"
              >
                { !!indicateur.estIndicateurDuBaromètre &&
                <PictoBaromètre
                  className='fr-mr-1w'
                  taille={{ mesure: 1.25, unité: 'rem' }}
                /> }
                { indicateur.nom }
              </Titre>
              <p className='fr-mb-2w information-secondaire texte-gris'>
                Dernière mise à jour : Non renseigné
              </p>
            </div>
            {
            estDisponibleALImport ? 
              <FormulaireIndicateur
                chantierId={chantierId}
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
            colonnes={colonnes}
            données={indicateurDétailsParTerritoires}
            titre={`Tableau de l'indicateur : ${indicateur.nom}`}
          />
          {
            !!estInteractif &&
              <IndicateurDétails
                indicateur={indicateur}
                indicateurDétailsParTerritoires={indicateurDétailsParTerritoires}
              />
          }
        </section>
      </Bloc>
    </IndicateurBlocStyled>
  );
}
