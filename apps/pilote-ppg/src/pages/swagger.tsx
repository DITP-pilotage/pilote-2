import { useCallback, useEffect, useRef } from "react";
import Script from "next/script";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import data from "../../doc/api/pilote-api.yml";

declare global {
  interface Window {
    SwaggerUIBundle: (config: { spec: unknown; domNode: HTMLElement }) => void;
  }
}

export const getServerSideProps: GetServerSideProps = async () => ({
  props: { spec: data },
});

const SwaggerUIPOC = ({
  spec,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  const initSwaggerUI = useCallback(() => {
    if (initializedRef.current || !containerRef.current) return;
    initializedRef.current = true;
    window.SwaggerUIBundle({
      spec,
      domNode: containerRef.current,
    });
  }, [spec]);

  useEffect(() => {
    // @ts-ignore
    if (window.SwaggerUIBundle) {
      initSwaggerUI();
    }
  }, [initSwaggerUI]);

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="/swagger-ui/swagger-ui.css" />
      <Script src="/swagger-ui/swagger-ui-bundle.js" onLoad={initSwaggerUI} />
      <main>
        <div ref={containerRef}>
          <div className="w-full mx-auto px-4 lg:px-6 xl:max-w-[78rem] pb-4">
            Chargement de la documentation API
          </div>
        </div>
      </main>
    </>
  );
};

export default SwaggerUIPOC;
