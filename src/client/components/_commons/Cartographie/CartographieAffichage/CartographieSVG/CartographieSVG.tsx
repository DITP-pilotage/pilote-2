import { memo, useEffect, useRef, useState } from 'react';
import CartographieSVGProps, { Viewbox } from '@/components/_commons/Cartographie/CartographieAffichage/CartographieSVG/CartographieSVG.interface';
import CartographieZoomEtDéplacement
  from '@/components/_commons/Cartographie/CartographieZoomEtDéplacement/CartographieZoomEtDéplacement';
import CartographieSVGStyled from './CartographieSVG.styled';

function CartographieSVG({ tracésRégions, setTerritoireSurvolé }: CartographieSVGProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [viewbox, setViewbox] = useState<Viewbox>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  useEffect(() => {
    if (svgRef && svgRef.current)
      setViewbox(svgRef.current.getBBox());
  }, [svgRef]);

  return (
    <CartographieSVGStyled>
      <CartographieZoomEtDéplacement
        svgRef={svgRef}
        viewbox={viewbox}
      />
      <svg
        ref={svgRef}
        version="1.2"
        viewBox={`
          ${viewbox.x}
          ${viewbox.y}
          ${viewbox.width}
          ${viewbox.height}
        `}
        xmlns="http://www.w3.org/2000/svg"
      >
        <g
          className="canvas"
          onMouseLeave={() => {
            setTerritoireSurvolé(null);
          }}
        >
          {
            tracésRégions.map((tracéRégion) => (
              <g key={tracéRégion.nom}>
                {tracéRégion.départementsÀTracer.map(département => (
                  <path
                    className="territoire-rempli"
                    d={département.tracéSVG}
                    key={département.nom}
                    onMouseEnter={() => {
                      setTerritoireSurvolé({ codeInsee: département.codeInsee, nom: département.nom, valeur: département.valeur });
                    }}
                  />
                ))}
                {
                  tracéRégion.départementsÀTracer.length === 0
                    ?
                      <path
                        className='territoire-rempli'
                        d={tracéRégion.tracéSVG}
                        onMouseEnter={() => {
                          setTerritoireSurvolé({ codeInsee: tracéRégion.codeInsee, nom: tracéRégion.nom, valeur: tracéRégion.valeur });
                        }}
                      />
                    :
                      <path
                        className='frontière'
                        d={tracéRégion.tracéSVG}
                      />
                  }
              </g>
            ))
          }
        </g>
      </svg>
    </CartographieSVGStyled>
  );
}

export default memo(CartographieSVG, (prevProps, nextProps) => (
  prevProps.tracésRégions === nextProps.tracésRégions &&
  prevProps.setTerritoireSurvolé === nextProps.setTerritoireSurvolé
));
