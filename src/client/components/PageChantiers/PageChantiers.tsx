import '@gouvfr/dsfr/dist/component/form/form.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-device/icons-device.min.css';
import { useMemo, useState } from 'react';
import Bloc from '@/components/_commons/Bloc/Bloc';
import { filtresActifs as filtresActifsStore, actions as actionsFiltresStore } from '@/stores/useFiltresStore/useFiltresStore';
import Titre from '@/components/_commons/Titre/Titre';
import BarreLatérale from '@/components/_commons/BarreLatérale/BarreLatérale';
import BarreLatéraleEncart from '@/components/_commons/BarreLatérale/BarreLatéraleEncart/BarreLatéraleEncart';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import SélecteursMaillesEtTerritoires from '@/components/_commons/SélecteursMaillesEtTerritoires/SélecteursMaillesEtTerritoires';
import Avancements from '@/components/_commons/Avancements/Avancements';
import {
  actionsTerritoiresStore,
  mailleAssociéeAuTerritoireSélectionnéTerritoiresStore,
  mailleSélectionnéeTerritoiresStore,
  territoireSélectionnéTerritoiresStore,
} from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import { AgrégateurChantiersParTerritoire } from '@/client/utils/chantier/agrégateur/agrégateur';
import { objectEntries } from '@/client/utils/objects/objects';
import nuancierPourcentage from '@/client/constants/nuanciers/nuancierPourcentage';
import PageChantiersProps from './PageChantiers.interface';
import RépartitionMétéo from './RépartitionMétéo/RépartitionMétéo';
import ListeChantiers from './ListeChantiers/ListeChantiers';
import FiltresActifs from './FiltresActifs/FiltresActifs';
import PageChantiersStyled from './PageChantiers.styled';
import Filtres from './Filtres/Filtres';
import CartographieTauxAvancement from '../_commons/Cartographie/CartographieTauxAvancement/CartographieTauxAvancement';

export default function PageChantiers({ chantiers, ministères }: PageChantiersProps) {  
  const [estOuverteBarreLatérale, setEstOuverteBarreLatérale] = useState(false);

  const filtresActifs = filtresActifsStore();
  const { récupérerNombreFiltresActifs } = actionsFiltresStore();

  const { récupérerDétailsSurUnTerritoire } = actionsTerritoiresStore();
  const mailleAssociéeAuTerritoireSélectionné = mailleAssociéeAuTerritoireSélectionnéTerritoiresStore();
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();

  const chantiersFiltrés = useMemo(() => {
    return filtresActifs.périmètresMinistériels.length > 0 || filtresActifs.autresFiltres.length > 0 
      ? chantiers.filter(chantier => (
        filtresActifs.périmètresMinistériels.some(filtre => chantier.périmètreIds.includes(filtre.id)) || 
        filtresActifs.autresFiltres.some(filtre => chantier[filtre.attribut as keyof Chantier])
      ))
      : chantiers;
  }, [chantiers, filtresActifs]);

  const donnéesTerritoiresAgrégées = useMemo(() => {
    return new AgrégateurChantiersParTerritoire(chantiersFiltrés).agréger();
  }, [chantiersFiltrés]);

  const avancements = {
    moyenne: donnéesTerritoiresAgrégées[mailleAssociéeAuTerritoireSélectionné].territoires[territoireSélectionné.codeInsee].répartition.avancements.moyenne,
    médiane: donnéesTerritoiresAgrégées[mailleSélectionnée].répartition.avancements.médiane,
    minimum: donnéesTerritoiresAgrégées[mailleSélectionnée].répartition.avancements.minimum,
    maximum: donnéesTerritoiresAgrégées[mailleSélectionnée].répartition.avancements.maximum,
  };

  const météos = donnéesTerritoiresAgrégées[mailleAssociéeAuTerritoireSélectionné].territoires[territoireSélectionné.codeInsee].répartition.météos;

  let data: any = {};

  const déterminerRemplissage = (valeur: number | null) => {
    if (valeur === null) return '#bababa';

    return nuancierPourcentage.find(({ seuil }) => seuil !== null && seuil >= valeur)!.remplissage.couleur;
  };

  useMemo(() => {
    objectEntries(donnéesTerritoiresAgrégées[mailleSélectionnée].territoires).forEach(([codeInsee, territoire]) => {
      const détailTerritoire = récupérerDétailsSurUnTerritoire(codeInsee, mailleSélectionnée);
    
      data[codeInsee] = {
        valeurAffichée: territoire.répartition.avancements.moyenne?.toFixed(0) + '%',
        remplissage: déterminerRemplissage(territoire.répartition.avancements.moyenne),
        libellé: mailleSélectionnée === 'départementale' ? `${détailTerritoire?.codeInsee} - ${détailTerritoire?.nom}` : détailTerritoire?.nom,
      };
    });
  }, [donnéesTerritoiresAgrégées, mailleSélectionnée, récupérerDétailsSurUnTerritoire, data]);

  return (
    <PageChantiersStyled className="flex">
      <BarreLatérale
        estOuvert={estOuverteBarreLatérale}
        setEstOuvert={setEstOuverteBarreLatérale}
      >
        <BarreLatéraleEncart>
          <SélecteursMaillesEtTerritoires />
        </BarreLatéraleEncart>
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
                  <Titre
                    baliseHtml='h2'
                    className='fr-h6'
                  >
                    Répartition géographique
                  </Titre>
                  <CartographieTauxAvancement
                    données={data}
                    options={{ territoireSélectionnable: true }}
                  />
                </Bloc>
              </div>
              <div className="fr-col-12 fr-col-lg-6">
                <Bloc>
                  <div className='fr-container--fluid'>
                    <div className="fr-grid-row">
                      <Titre
                        baliseHtml='h2'
                        className='fr-h6'
                      >
                        Taux d’avancement moyen de la sélection
                      </Titre>
                      <Avancements avancements={avancements} />
                    </div>
                  </div>
                  <hr className='fr-hr fr-my-3w fr-pb-1v' />
                  <RépartitionMétéo météos={météos} />
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
