import Document, { Html, Head, Main, NextScript, DocumentContext, DocumentInitialProps } from 'next/document';
import React, { createElement } from 'react';

// Étendre l'interface DocumentInitialProps pour inclure le nonce
interface MyDocumentProps extends DocumentInitialProps {
  nonce: string;
  isDevelopment: boolean;
}

class MyDocument extends Document<MyDocumentProps> {
  static async getInitialProps(ctx: DocumentContext): Promise<MyDocumentProps> {
    const originalRenderPage = ctx.renderPage;

    // Détecter l'environnement de développement
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Récupérer le nonce depuis les en-têtes de réponse ou générer un nouveau
    const nonce = ctx.res?.getHeader('x-nonce') as string || '';
    
    // Create the Emotion cache with the nonce
    ctx.renderPage = () =>
      originalRenderPage({
        enhanceApp: (App) => (props) => {
          return createElement(App, {
            ...props,
            // Passer explicitement le nonce et le cache Emotion
            // @ts-ignore - Ces propriétés sont définies dans l'interface MyAppProps
            nonce: nonce,
          });
        },
      });

    const initialProps = await Document.getInitialProps(ctx);
    
    return {
      ...initialProps,
      nonce,
      isDevelopment,
    };
  }

  render() {
    const { nonce, isDevelopment, styles } = this.props;

    return (
      <Html 
        lang='fr'
      >
        <Head>
          <meta charSet='utf-8' />
          <meta 
            content='width=device-width, initial-scale=1' 
            name='viewport' 
          />
          <meta 
            content='IE=edge' 
            httpEquiv='X-UA-Compatible' 
          />
          <meta 
            content='origin' 
            name='referrer' 
          />
          <link 
            href='/favicon/apple-touch-icon.png' 
            rel='apple-touch-icon' 
            sizes='180x180' 
          />
          <link 
            href='/favicon/favicon-32x32.png' 
            rel='icon' 
            sizes='32x32' 
            type='image/png' 
          />
          <link 
            href='/favicon/favicon-16x16.png' 
            rel='icon' 
            sizes='16x16' 
            type='image/png' 
          />
          <link 
            href='/site.webmanifest' 
            rel='manifest' 
          />
          <link 
            color='#000091' 
            href='/favicon/safari-pinned-tab.svg' 
            rel='mask-icon' 
          />
          <meta 
            content='#000091' 
            name='msapplication-TileColor' 
          />
          <meta 
            content='#000091' 
            name='theme-color' 
          />
          <link
            href='/favicon/favicon.svg'
            rel='icon'
            type='image/svg+xml'
          />
          <link
            href='/favicon/favicon.ico'
            rel='shortcut icon'
            type='image/x-icon'
          />
          {styles}
        </Head>
        <body>
          {typeof window === 'undefined' && nonce && !isDevelopment ? (
            <script
              // This is a safe usage of dangerouslySetInnerHTML to set the nonce for CSP
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{
                __html: `window.__nonce = "${nonce}";`,
              }}
              nonce={nonce}
            />
          ) : null}
          <Main />
          <NextScript nonce={nonce} />
        </body>
      </Html>
    );
  }
}

export default MyDocument; 
