module.exports = {
  extends: ['@commitlint/config-conventional'],
  parserPreset: {
    parserOpts: {
      headerPattern: /^(\w*)(?:\((.*)\))?!?: (.*) \((PIL-\d*)\)$/,
      breakingHeaderPattern: /^(\w*)(?:\((.*)\))?!: (.*) \((PIL-\d*)\)$/,
      headerCorrespondence: [
        'type',
        'scope',
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
      }
    }
  ],
  rules: {
    "header-match-ticket": [2, "always"],
  }
}
