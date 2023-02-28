export const objectEntries = <Obj extends Object>(object: Obj): Array<[keyof Obj, Obj[keyof Obj]]> => {
  return Object.entries(object) as Array<[keyof Obj, Obj[keyof Obj]]>;
};

export const objectKeys = <Obj extends Object>(object: Obj): Array<keyof Obj> => {
  return Object.keys(object) as Array<keyof Obj>;
};
