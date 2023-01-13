import { memo, useEffect, useRef, useState } from 'react';
import CartographieSVGProps, { Viewbox } from './CartographieSVG.interface';
import CartographieZoomEtDéplacement from './ZoomEtDéplacement/CartographieZoomEtDéplacement';
import CartographieSVGStyled from './CartographieSVG.styled';

function CartographieSVG({ options, territoires, setTerritoireSurvolé }: CartographieSVGProps) {
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
            territoires.map((territoire) => (
              <g key={territoire.nom}>
                {territoire.sousTerritoires.map(sousTerritoire => (

                  <path
                    className="territoire-rempli"
                    d={sousTerritoire.tracéSVG}
                    fill={options.couleurDeRemplissage(sousTerritoire.valeur)}
                    key={sousTerritoire.nom}
                    onMouseEnter={() => {
                      setTerritoireSurvolé({
                        codeInsee: sousTerritoire.codeInsee,
                        nom: sousTerritoire.nom,
                        valeur: sousTerritoire.valeur,
                        divisionAdministrative: sousTerritoire.divisionAdministrative,
                      });
                    }}
                  />
                ))}
                {
                  territoire.sousTerritoires.length === 0
                    ?
                      <path
                        className='territoire-rempli'
                        d={territoire.tracéSVG}
                        fill={options.couleurDeRemplissage(territoire.valeur)}
                        onMouseEnter={() => {
                          setTerritoireSurvolé({
                            codeInsee: territoire.codeInsee,
                            nom: territoire.nom,
                            valeur: territoire.valeur,
                            divisionAdministrative: territoire.divisionAdministrative,
                          });
                        }}
                      />
                    :
                      <path
                        className='territoire-frontière'
                        d={territoire.tracéSVG}
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
  prevProps.territoires === nextProps.territoires &&
  prevProps.setTerritoireSurvolé === nextProps.setTerritoireSurvolé
));
