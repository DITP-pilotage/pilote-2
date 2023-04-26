import PageRapportDétailléStyled from '@/components/PageRapportDétaillé/PageRapportDétaillé.styled';
import Titre from '@/components/_commons/Titre/Titre';
import PageRapportDétailléProps from '@/components/PageRapportDétaillé/PageRapportDétaillé.interface';


export default function PageRapportDétaillé({ chantiers }: PageRapportDétailléProps) {
  return (
    <PageRapportDétailléStyled>
      <main className="fr-container">
        <Titre
          baliseHtml="h1"
          className="fr-h2"
        >
          {`Rapport détaillé : ${ chantiers.length } chantiers`}
        </Titre>
      </main>
    </PageRapportDétailléStyled>
  );
}

