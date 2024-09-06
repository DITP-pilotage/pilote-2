import { FunctionComponent } from 'react';

interface TitreProps {
  children: React.ReactNode
  baliseHtml: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  className?: string
  estInline? : boolean
}

const Titre: FunctionComponent<TitreProps> = ({ children, baliseHtml, className, estInline = false }) => {
  const Balise = `${baliseHtml}` as keyof JSX.IntrinsicElements;

  return (
    <Balise
      className={className}
      style={{
        display: estInline ? 'inline' : undefined,
      }}
    >
      {children}
    </Balise>
  );
};

export default Titre;
