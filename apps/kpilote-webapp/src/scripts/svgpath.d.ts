declare module 'svgpath' {
  type Segment = [string, ...number[]]

  interface SvgPath {
    abs(): SvgPath
    rel(): SvgPath
    unshort(): SvgPath
    unarc(): SvgPath
    iterate(
      callback: (segment: Segment, index: number, lastX: number, lastY: number) => void,
    ): SvgPath
  }

  function svgpath(path: string): SvgPath
  export = svgpath
}
