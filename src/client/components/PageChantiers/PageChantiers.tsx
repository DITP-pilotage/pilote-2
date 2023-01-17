import { useMemo, useState } from 'react';
import Bloc from '@/components/_commons/Bloc/Bloc';
import { filtresActifs as filtresActifsStore, actions as actionsFiltresStore } from '@/stores/useFiltresStore/useFiltresStore';
import Titre from '@/components/_commons/Titre/Titre';
import PageChantiersProps from './PageChantiers.interface';
import RépartitionGéographique from './RépartitionGéographique/RépartitionGéographique';
import TauxAvancementMoyen from './TauxAvancementMoyen/TauxAvancementMoyen';
import RépartitionTauxAvancement from './RépartitionTauxAvancement/RépartitionTauxAvancement';
import RépartitionMétéo from './RépartitionMétéo/RépartitionMétéo';
import BarreLatérale from './BarreLatérale/BarreLatérale';
import ListeChantiers from './ListeChantiers/ListeChantiers';
import FiltresActifs from './FiltresActifs/FiltresActifs';
import PageChantiersStyled from './PageChantiers.styled';
import { NiveauDeMaille } from '../_commons/Cartographie/Cartographie.interface';

export default function PageChantiers({ chantiers, périmètresMinistériels }: PageChantiersProps) {
  const [estOuverteBarreFiltres, setEstOuverteBarreFiltres] = useState(false);
  const [niveauDeMaille, setNiveauDeMaille] = useState<NiveauDeMaille>('départementale');

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

  return (
    <PageChantiersStyled className="flex">
      <BarreLatérale
        estOuvert={estOuverteBarreFiltres}
        périmètresMinistériels={périmètresMinistériels}
        setEstOuvert={setEstOuverteBarreFiltres}
        setNiveauDeMaille={setNiveauDeMaille}
      />
      <div className='contenu-principal'>
        <button
          className="fr-sr-only-xl fr-btn fr-btn--secondary fr-mb-2w"
          onClick={() => setEstOuverteBarreFiltres(true)}
          title="Ouvrir les filtres"
          type="button"
        >
          Filtres
        </button>
        <div>
          {
            récupérerNombreFiltresActifs() > 0 && (
              <FiltresActifs />
            )
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
                  <RépartitionGéographique
                    chantiers={chantiersFiltrés}
                    niveauDeMaille={niveauDeMaille}
                  />
                </Bloc>
              </div>
              <div className="fr-col-12 fr-col-lg-6">
                <Bloc>
                  <TauxAvancementMoyen />
                  <hr className='fr-hr fr-my-3w fr-pb-1v' />
                  <RépartitionMétéo chantiers={chantiersFiltrés} />
                </Bloc>
              </div>
            </div>
            <div className="fr-grid-row fr-my-3w">
              <div className="fr-col">
                <Bloc>
                  <RépartitionTauxAvancement />
                </Bloc>
              </div>
            </div>
            <div className="fr-grid-row">
              <div className="fr-col">
                <Bloc>
                  <ListeChantiers chantiers={chantiersFiltrés} />
                </Bloc>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageChantiersStyled>
  );
}
