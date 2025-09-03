module.exports = {
  extends: ["@commitlint/config-conventional"],
  parserPreset: {
    parserOpts: {
      headerPattern: /^(.+) \((PIL-\d+)\)$/,
      breakingHeaderPattern: /^(.+) \((PIL-\d+)\)$/,
    },
  },
};
