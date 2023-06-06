import TitreProps from './Titre.interface';

export default function Titre({ children, baliseHtml, className, estInline = false }: TitreProps) {
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
}
