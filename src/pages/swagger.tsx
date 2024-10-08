import 'swagger-ui-react/swagger-ui.css';
import dynamic from 'next/dynamic';
import { GetServerSideProps } from 'next';
import { RécupérerVariableContenuUseCase } from '@/server/gestion-contenu/usecases/RécupérerVariableContenuUseCase';
import data from '../../doc/api/pilote-api.yml';

const DynamicSwaggerUI = dynamic(() => import('swagger-ui-react'), {
  ssr: false,
  loading: () => (
    <main>
      <div className='fr-container fr-pb-2w'>
        Chargement de la documentation API
      </div>
    </main>
  ),
});

export const getServerSideProps: GetServerSideProps<{}> = async () => {
  const estDocsAPIActive = new RécupérerVariableContenuUseCase().run({ nomVariableContenu: 'NEXT_PUBLIC_FF_DOCS_API' }) as boolean;

  return estDocsAPIActive ? { props: {} } : {
    redirect: {
      destination: '404',
      permanent: true,
    },
  };
};

const SwaggerUIPOC = () => {
  return <DynamicSwaggerUI spec={data} />;
};

export default SwaggerUIPOC;
