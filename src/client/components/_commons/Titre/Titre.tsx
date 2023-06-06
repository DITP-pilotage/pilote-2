import TitreProps from './Titre.interface';

export default function Titre({ children, baliseHtml, className, estInlineBlock = false }: TitreProps) {
  const Balise = `${baliseHtml}` as keyof JSX.IntrinsicElements;

  return (
    <Balise
      className={className}
      style={{
        display: estInlineBlock ? 'inline-block' : undefined,
      }}
    >
      {children}
    </Balise>
  );
}
