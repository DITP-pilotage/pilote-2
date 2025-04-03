import { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import Head from 'next/head';
import { FunctionComponent } from 'react';
import PageChantier from '@/components/PageChantier/PageChantier';
import Indicateur from '@/server/chantiers/domain/Indicateur';
import { ChantierInformations } from '@/components/PageImportIndicateur/ChantierInformation.interface';
import { ProfilEnum } from '@/server/app/enum/profil.enum';
import { ProfilCode } from '@/server/domain/utilisateur/Utilisateur.interface';
import ChoixTerritoire from '@/components/PageChantier/ChoixTerritoire/ChoixTerritoire';
import { IndicateurPondération } from '@/components/PageChantier/PageChantier.interface';
import { CommentaireChantierContrat } from '@/server/chantiers/app/contrats/CommentaireChantierContrat';
import { DecisionStrategiqueChantierContrat } from '@/server/chantiers/app/contrats/DecisionStrategiqueChantierContrat';
import { ObjectifChantierContrat } from '@/server/chantiers/app/contrats/ObjectifChantierContrat';
import { SynthèseDesRésultatsContrat } from '@/server/chantiers/app/contrats/SynthèseDesRésultatsContrat';
import {
  DétailsIndicateurs,
  DétailsIndicateurTerritoire,
} from '@/server/chantiers/domain/DétailsIndicateur';
import { AvancementChantierContrat } from '@/components/PageChantier/AvancementChantier';
import Chantier from '@/server/chantiers/domain/Chantier.interface';
import { CoordinateurTerritorial, DonneesComparaisonDuTauxDAvancementType, ResponsableLocal } from '@/server/domain/territoire/Territoire.interface';
import { MailleInterne } from '@/server/chantiers/domain/Maille';
import { CartographieType } from '@/components/PageChantier/Cartes/Cartes';
import { CartographieIndicateurType } from '@/components/_commons/IndicateursChantier/Bloc/Détails/IndicateurDétails';

interface NextPageChantierProps {
  indicateurs: Indicateur[],
  chantierInformations: ChantierInformations,
  mailleQuery: MailleInterne
  mailleSelectionnee: MailleInterne
  territoireCode: string
  territoiresCompares: string[]
  profil: ProfilCode
  synthèseDesRésultats: SynthèseDesRésultatsContrat
  commentaires: CommentaireChantierContrat
  objectifs: ObjectifChantierContrat
  décisionStratégique: DecisionStrategiqueChantierContrat
  détailsIndicateurs: DétailsIndicateurs
  detailsIndicateursTerritoire: Record<string, DétailsIndicateurTerritoire>
  avancements: AvancementChantierContrat
  indicateurPondérations: IndicateurPondération[]
  chantier: Chantier
  listeResponsablesLocaux: ResponsableLocal[]
  listeCoordinateursTerritorials: CoordinateurTerritorial[]
  jalon: number
  cartographieGaucheChantier: CartographieType
  cartographieDroiteChantier: CartographieType
  cartographieDroiteIndicateur: CartographieIndicateurType
  cartographieGaucheIndicateur: CartographieIndicateurType
  donneesComparaisonDuTauxDAvancement: DonneesComparaisonDuTauxDAvancementType
}

export const getServerSideProps: GetServerSideProps<NextPageChantierProps> = async (context) => {
  return getContainer('chantier').resolve('pageAccueilHandler').handle(context);
};

const NextPageChantier: FunctionComponent<InferGetServerSidePropsType<typeof getServerSideProps>> = ({
  indicateurs,
  chantierInformations,
  territoireCode,
  territoiresCompares,
  profil,
  mailleSelectionnee,
  mailleQuery,
  synthèseDesRésultats,
  commentaires,
  objectifs,
  décisionStratégique,
  détailsIndicateurs,
  detailsIndicateursTerritoire,
  avancements,
  indicateurPondérations,
  chantier,
  listeResponsablesLocaux,
  listeCoordinateursTerritorials,
  jalon,
  cartographieDroiteChantier,
  cartographieGaucheChantier,
  cartographieDroiteIndicateur,
  cartographieGaucheIndicateur,
  donneesComparaisonDuTauxDAvancement,
}) => {
  const estUnProfilDROM = profil === ProfilEnum.DROM;
  const estTerritoireNational = territoireCode === 'NAT-FR';

  return (
    <>
      <Head>
        <title>
          {`Chantier ${chantierInformations.id.replace('CH-', '')} - ${chantierInformations.nom} - PILOTE`}
        </title>
      </Head>
      {
        estTerritoireNational && estUnProfilDROM && !chantierInformations.estUnChantierDROM ? (
          <ChoixTerritoire
            chantier={chantier}
            mailleQuery={mailleQuery}
            mailleSelectionnee={mailleSelectionnee}
            territoireCode={territoireCode}
          />
        ) : (
          <PageChantier
            avancements={avancements}
            cartographieDroiteChantier={cartographieDroiteChantier}
            cartographieDroiteIndicateur={cartographieDroiteIndicateur}
            cartographieGaucheChantier={cartographieGaucheChantier}
            cartographieGaucheIndicateur={cartographieGaucheIndicateur}
            chantier={chantier}
            commentaires={commentaires}
            detailsIndicateursTerritoire={detailsIndicateursTerritoire}
            donneesComparaisonDuTauxDAvancement={donneesComparaisonDuTauxDAvancement}
            décisionStratégique={décisionStratégique as DecisionStrategiqueChantierContrat}
            détailsIndicateurs={détailsIndicateurs}
            indicateurPondérations={indicateurPondérations}
            indicateurs={indicateurs}
            jalon={jalon}
            listeCoordinateursTerritorials={listeCoordinateursTerritorials}
            listeResponsablesLocaux={listeResponsablesLocaux}
            mailleQuery={mailleQuery}
            mailleSelectionnee={mailleSelectionnee}
            objectifs={objectifs}
            synthèseDesRésultats={synthèseDesRésultats}
            territoireCode={territoireCode}
            territoiresCompares={territoiresCompares}
          />
        )
      }
    </>
  );
};

export default NextPageChantier;
