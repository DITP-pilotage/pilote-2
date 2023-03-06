/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from 'react';
import { AgrégateurChantiersParTerritoire } from '@/client/utils/chantier/agrégateur/agrégateur';
import { mailleSélectionnéeTerritoiresStore, territoireSélectionnéTerritoiresStore, mailleAssociéeAuTerritoireSélectionnéTerritoiresStore, territoiresComparésTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { FichesIndicateurs } from '@/server/domain/indicateur/DetailsIndicateur.interface';
import { Commentaires } from '@/server/domain/chantier/Commentaire.interface';

export default function usePageChantier(chantier: Chantier) {
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  const mailleAssociéeAuTerritoireSélectionné = mailleAssociéeAuTerritoireSélectionnéTerritoiresStore();
  const territoiresComparés = territoiresComparésTerritoiresStore();  
  
  const [détailsIndicateurs, setDétailsIndicateurs] = useState<FichesIndicateurs | null>(null);
  const [commentaires, setCommentaires] = useState<Commentaires | null>(null);

  useEffect(() => {
    fetch(`/api/chantier/${chantier.id}?codeInsee=${territoireSélectionné.codeInsee}&maille=${mailleAssociéeAuTerritoireSélectionné}`)
      .then(réponse => {
        return réponse.json();
      })
      .then(données => {
        setCommentaires(données?.commentaires ?? null);
      });
  }, [chantier.id, mailleAssociéeAuTerritoireSélectionné, territoireSélectionné.codeInsee]);

  useEffect(() => {
    if (territoiresComparés.length > 0) return;    
    fetch(`/api/chantier/${chantier.id}/indicateurs?codesInsee=${territoireSélectionné.codeInsee}&maille=${mailleAssociéeAuTerritoireSélectionné}`)
      .then(réponse => réponse.json())
      .then(données => setDétailsIndicateurs(données));
  }, [chantier.id, mailleAssociéeAuTerritoireSélectionné, territoireSélectionné.codeInsee, mailleSélectionnée]);
  
  useEffect(() => {
    const codesInsee = territoiresComparés.map(territoire => `codesInsee=${territoire.codeInsee}`).join('&');
    if (codesInsee === '' || codesInsee === 'codesInsee=FR') return;
    fetch(`/api/chantier/${chantier.id}/indicateurs?${codesInsee}&maille=${mailleSélectionnée}`)
      .then(réponse => réponse.json())
      .then(données => setDétailsIndicateurs(données));
  }, [territoiresComparés]);

  const donnéesTerritoiresAgrégées = useMemo(() => new AgrégateurChantiersParTerritoire([chantier]).agréger(), [chantier]);
    
  const avancementRégional = () => {
    if (mailleAssociéeAuTerritoireSélectionné === 'régionale')
      return donnéesTerritoiresAgrégées.régionale.territoires[territoireSélectionné.codeInsee].répartition.avancements.moyenne;

    if (mailleAssociéeAuTerritoireSélectionné === 'départementale' && territoireSélectionné.codeInseeParent)
      return donnéesTerritoiresAgrégées.régionale.territoires[territoireSélectionné.codeInseeParent].répartition.avancements.moyenne;
  };

  const avancementDépartemental = () => {
    if (mailleAssociéeAuTerritoireSélectionné === 'départementale')
      return donnéesTerritoiresAgrégées[mailleSélectionnée].territoires[territoireSélectionné.codeInsee].répartition.avancements.moyenne;
  };

  const avancements = {
    nationale: {
      moyenne: donnéesTerritoiresAgrégées.nationale.répartition.avancements.moyenne,
      médiane: donnéesTerritoiresAgrégées[mailleSélectionnée].répartition.avancements.médiane,
      minimum: donnéesTerritoiresAgrégées[mailleSélectionnée].répartition.avancements.minimum,
      maximum: donnéesTerritoiresAgrégées[mailleSélectionnée].répartition.avancements.maximum,
    },
    départementale: {
      moyenne: avancementDépartemental(),
    },
    régionale: {
      moyenne: avancementRégional(),
    },
  };

  return { avancements, détailsIndicateurs, commentaires };
}
