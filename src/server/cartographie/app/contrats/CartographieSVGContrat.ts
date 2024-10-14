export interface CartographieSVGContrat {
  svg: {
    defs: any;
    g: {
      path: {
        'attr-d': string;
        'attr-territoire-code': string;
      }[];
    };
  };
}
