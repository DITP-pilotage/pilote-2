const Titre = ({
  children,
  baliseHtml,
  className,
  title,
  estInline = false,
  ref,
}: {
  children: React.ReactNode;
  baliseHtml: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  className?: string;
  title?: string;
  estInline?: boolean;
  ref: React.Ref<HTMLHeadingElement>;
}) => {
  const Balise = baliseHtml as React.ElementType;

  return (
    <Balise
      className={className}
      style={{
        display: estInline ? "inline" : undefined,
      }}
      title={title}
      ref={ref}
    >
      {children}
    </Balise>
  );
};

export default Titre;
