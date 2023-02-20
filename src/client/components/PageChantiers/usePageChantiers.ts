import { useMemo } from 'react';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { AgrégateurChantiersParTerritoire } from '@/client/utils/chantier/agrégateur/agrégateur';
import { actions as actionsFiltresStore, filtresActifs as filtresActifsStore } from '@/stores/useFiltresStore/useFiltresStore';
import {
  actionsTerritoiresStore,
  mailleAssociéeAuTerritoireSélectionnéTerritoiresStore,
  mailleSélectionnéeTerritoiresStore,
  territoireSélectionnéTerritoiresStore,
} from '@/stores/useTerritoiresStore/useTerritoiresStore';
import nuancierPourcentage from '@/client/constants/nuanciers/nuancierPourcentage';
import { objectEntries } from '@/client/utils/objects/objects';

export default function usePageChantiers(chantiers: Chantier[]) {
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

  const déterminerRemplissage = (valeur: number | null) => {
    if (valeur === null) return '#bababa';

    return nuancierPourcentage.find(({ seuil }) => seuil !== null && seuil >= valeur)!.remplissage.couleur;
  };

  let donnéesCartographie: any = {};

  useMemo(() => {

    objectEntries(donnéesTerritoiresAgrégées[mailleSélectionnée].territoires).forEach(([codeInsee, territoire]) => {
      const détailTerritoire = récupérerDétailsSurUnTerritoire(codeInsee, mailleSélectionnée);

      donnéesCartographie[codeInsee] = {
        valeurAffichée: territoire.répartition.avancements.moyenne?.toFixed(0) + '%',
        remplissage: déterminerRemplissage(territoire.répartition.avancements.moyenne),
        libellé: mailleSélectionnée === 'départementale' ? `${détailTerritoire?.codeInsee} - ${détailTerritoire?.nom}` : détailTerritoire?.nom,
      };
    });
  }, [donnéesTerritoiresAgrégées, mailleSélectionnée, récupérerDétailsSurUnTerritoire, donnéesCartographie]);

  return {
    nombreFiltresActifs: récupérerNombreFiltresActifs(),
    chantiersFiltrés,
    avancements,
    météos,
    donnéesCartographie,
  };
}
