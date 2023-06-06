import TitreProps from './Titre.interface';

export default function Titre({ children, baliseHtml, className }: TitreProps) {
  const Balise = `${baliseHtml}` as keyof JSX.IntrinsicElements;

  return (
    <Balise
      className={className}
      style={{
        display: 'inline-block',
      }}
    >
      {children}
    </Balise>
  );
}
