/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from 'react';
import { AgrégateurChantiersParTerritoire } from '@/client/utils/chantier/agrégateur/agrégateur';
import { mailleSélectionnéeTerritoiresStore, territoireSélectionnéTerritoiresStore, mailleAssociéeAuTerritoireSélectionnéTerritoiresStore, territoiresComparésTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { Commentaires } from '@/server/domain/commentaire/Commentaire.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';
import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import { InfosChantier } from '@/server/domain/chantier/ChantierRepository.interface';
import api from '@/server/infrastructure/api/trpc/api';

export default function usePageChantier(chantier: Chantier) {
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  const mailleAssociéeAuTerritoireSélectionné = mailleAssociéeAuTerritoireSélectionnéTerritoiresStore();
  const territoiresComparés = territoiresComparésTerritoiresStore();  
  
  const [détailsIndicateurs, setDétailsIndicateurs] = useState<DétailsIndicateurs | null>(null);
  const [commentaires, setCommentaires] = useState<Commentaires | null>(null);
  const [météo, setMétéo] = useState<Météo>('NON_RENSEIGNEE');

  const { data: synthèseDesRésultats } = api.synthèseDesRésultats.récupérerLaPlusRécente.useQuery(
    { 
      chantierId: chantier.id, 
      maille: mailleAssociéeAuTerritoireSélectionné, 
      codeInsee: territoireSélectionné.codeInsee,
    },
    { staleTime: Number.POSITIVE_INFINITY },
  );
  
  useEffect(() => {
    fetch(`/api/chantier/${chantier.id}?codeInsee=${territoireSélectionné.codeInsee}&maille=${mailleAssociéeAuTerritoireSélectionné}`)
      .then(réponse => {
        return réponse.json() as Promise<InfosChantier>;
      })
      .then(données => {
        // TODO améliorer la gestion d'erreur
        setCommentaires(données?.commentaires ?? null);
        setMétéo(données?.météo ?? 'NON_RENSEIGNEE');
      });
  }, [chantier.id, mailleAssociéeAuTerritoireSélectionné, territoireSélectionné.codeInsee]);

  useEffect(() => {
    if (territoiresComparés.length > 0) return;    
    fetch(`/api/chantier/${chantier.id}/indicateurs?codesInsee=${territoireSélectionné.codeInsee}&maille=${mailleAssociéeAuTerritoireSélectionné}`)
      .then(réponse => réponse.json() as Promise<DétailsIndicateurs>)
      .then(données => setDétailsIndicateurs(données));
  }, [chantier.id, mailleAssociéeAuTerritoireSélectionné, territoireSélectionné.codeInsee, mailleSélectionnée]);
  
  useEffect(() => {
    const codesInsee = territoiresComparés.map(territoire => `codesInsee=${territoire.codeInsee}`).join('&');
    if (codesInsee === '' || codesInsee === 'codesInsee=FR') return;
    fetch(`/api/chantier/${chantier.id}/indicateurs?${codesInsee}&maille=${mailleSélectionnée}`)
      .then(réponse => réponse.json() as Promise<DétailsIndicateurs>)
      .then(données => setDétailsIndicateurs(données));
  }, [territoiresComparés]);

  const donnéesTerritoiresAgrégées = useMemo(() => new AgrégateurChantiersParTerritoire([chantier]).agréger(), [chantier]);

  const avancementRégional = () => {
    if (mailleAssociéeAuTerritoireSélectionné === 'régionale')
      return donnéesTerritoiresAgrégées.régionale.territoires[territoireSélectionné.codeInsee].répartition.avancements.global.moyenne;

    if (mailleAssociéeAuTerritoireSélectionné === 'départementale' && territoireSélectionné.codeInseeParent)
      return donnéesTerritoiresAgrégées.régionale.territoires[territoireSélectionné.codeInseeParent].répartition.avancements.global.moyenne;
  };

  const avancementDépartemental = () => {
    if (mailleAssociéeAuTerritoireSélectionné === 'départementale')
      return donnéesTerritoiresAgrégées[mailleSélectionnée].territoires[territoireSélectionné.codeInsee].répartition.avancements.global.moyenne;
  };

  const avancements = {
    nationale: {
      global: {
        moyenne: donnéesTerritoiresAgrégées.nationale.répartition.avancements.global.moyenne,
        médiane: donnéesTerritoiresAgrégées[mailleSélectionnée].répartition.avancements.global.médiane,
        minimum: donnéesTerritoiresAgrégées[mailleSélectionnée].répartition.avancements.global.minimum,
        maximum: donnéesTerritoiresAgrégées[mailleSélectionnée].répartition.avancements.global.maximum,
      },
      annuel: {
        moyenne: donnéesTerritoiresAgrégées.nationale.répartition.avancements.annuel.moyenne,
      },
    },
    départementale: {
      moyenne: avancementDépartemental(),
    },
    régionale: {
      moyenne: avancementRégional(),
    },
  };

  return { 
    avancements, 
    détailsIndicateurs, 
    commentaires, 
    météo, 
    synthèseDesRésultats: synthèseDesRésultats ?? null,
  };
}
