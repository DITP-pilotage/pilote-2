import { useMemo, useState } from 'react';
import Bloc from '@/components/_commons/Bloc/Bloc';
import { filtresActifs as filtresActifsStore, actions as actionsFiltresStore } from '@/stores/useFiltresStore/useFiltresStore';
import Titre from '@/components/_commons/Titre/Titre';
import {
  agrégerDonnéesTerritoires,
} from '@/client/utils/chantier/donnéesTerritoires/donnéesTerritoires';
import BarreLatérale from '@/components/_commons/BarreLatérale/BarreLatérale';
import PageChantiersProps from './PageChantiers.interface';
import RépartitionGéographique from './RépartitionGéographique/RépartitionGéographique';
import TauxAvancementMoyen from './TauxAvancementMoyen/TauxAvancementMoyen';
import RépartitionMétéo from './RépartitionMétéo/RépartitionMétéo';
import ListeChantiers from './ListeChantiers/ListeChantiers';
import FiltresActifs from './FiltresActifs/FiltresActifs';
import PageChantiersStyled from './PageChantiers.styled';
import Filtres from './Filtres/Filtres';

export default function PageChantiers({ chantiers, ministères }: PageChantiersProps) {
  const [estOuverteBarreLatérale, setEstOuverteBarreLatérale] = useState(false);

  const filtresActifs = filtresActifsStore();
  const { récupérerNombreFiltresActifs } = actionsFiltresStore();

  const chantiersFiltrés = useMemo(() => {
    if (filtresActifs.périmètresMinistériels.length === 0) {
      return chantiers;
    }

    return chantiers.filter(chantier => (
      filtresActifs.périmètresMinistériels.some(filtre => (
        chantier.périmètreIds.includes(filtre.id)
      ))
    ));
  }, [chantiers, filtresActifs]);

  const donnéesTerritoiresAgrégées = useMemo(() => agrégerDonnéesTerritoires(chantiersFiltrés.map(chantier => chantier.mailles)), [chantiersFiltrés]);

  return (
    <PageChantiersStyled className="flex">
      <BarreLatérale
        estOuvert={estOuverteBarreLatérale}
        setEstOuvert={setEstOuverteBarreLatérale}
      >
        <Filtres ministères={ministères} />
      </BarreLatérale>
      <div className='contenu-principal'>
        <button
          className="fr-sr-only-xl fr-btn fr-btn--secondary fr-mb-2w"
          onClick={() => setEstOuverteBarreLatérale(true)}
          title="Ouvrir les filtres"
          type="button"
        >
          Filtres
        </button>
        <div>
          {
            récupérerNombreFiltresActifs() > 0 && 
              <FiltresActifs />
          }
          <div className="fr-p-4w">
            <Titre
              baliseHtml='h1'
              className='fr-h4'
            >
              {`${chantiersFiltrés.length} chantiers`}
            </Titre>
            <div className="fr-grid-row fr-grid-row--gutters">
              <div className="fr-col-12 fr-col-lg-6">
                <Bloc>
                  <RépartitionGéographique donnéesTerritoiresAgrégées={donnéesTerritoiresAgrégées} />
                </Bloc>
              </div>
              <div className="fr-col-12 fr-col-lg-6">
                <Bloc>
                  <TauxAvancementMoyen donnéesTerritoiresAgrégées={donnéesTerritoiresAgrégées} />
                  <hr className='fr-hr fr-my-3w fr-pb-1v' />
                  <RépartitionMétéo donnéesTerritoiresAgrégées={donnéesTerritoiresAgrégées} />
                </Bloc>
              </div>
            </div>
            <div className="fr-grid-row fr-mt-3w">
              <div className="fr-col">
                <Bloc>
                  <ListeChantiers chantiers={chantiersFiltrés}  />
                </Bloc>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageChantiersStyled>
  );
}
