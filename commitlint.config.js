module.exports = {
  extends: ['@commitlint/config-conventional'],
  parserPreset: {
    parserOpts: {
      headerPattern: /^(.+) \((PIL-\d+)\)$/u,
      breakingHeaderPattern: /^(.+) \((PIL-\d+)\)$/u,
      headerCorrespondence: [
        'subject',
        'ticket'
      ],
    },
  },
  plugins: [
    {
      rules: {
        "header-match-ticket": (parsed) => {
          const { ticket } = parsed;
          if (ticket === null) {
            return [false, "Il manque le numéro de ticket"];
          }
          return [true, ""];
        },
      },
    }
  ],
  rules: {
    "header-match-ticket": [2, "always"],
  }
}
