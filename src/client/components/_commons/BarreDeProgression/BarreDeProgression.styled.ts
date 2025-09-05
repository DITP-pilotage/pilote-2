import styled from "@emotion/styled";

const BarreDeProgressionStyled = styled.div`
  max-width: 100%;

  .fr-btn {
    width: var(--icon-size) !important;
    min-width: var(--icon-size) !important;
    height: var(--icon-size) !important;
    min-height: var(--icon-size) !important;
    padding: 0 !important;
    margin: 0 !important;

    &::before {
      margin-right: 0 !important;
    }
  }

  .barre {
    progress {
      display: block;
      width: 100%;
      border-radius: 0.375rem;

      &.progress--xxs {
        height: 0.5rem;
      }

      &.progress--xs {
        height: 0.625rem;
      }

      &.progress--sm {
        height: 0.75rem;
      }

      &.progress--md {
        height: 0.75rem;
      }

      &.progress--lg {
        height: 2rem;
      }

      &.progress--bleu {
        background-color: var(--blue-ecume-850-200);

        &::-webkit-progress-bar {
          background-color: var(--blue-ecume-850-200);
        }
      }

      &.progress--blanc {
        background-color: #fff;

        &::-webkit-progress-bar {
          background-color: #fff;
        }
      }

      &.progress--gris-moyen {
        background-color: #bababa;

        &::-webkit-progress-bar {
          background-color: #bababa;
        }
      }

      &.progress--gris-clair {
        background-color: #e5e5e5;

        &::-webkit-progress-bar {
          background-color: #e5e5e5;
        }
      }

      &.progress--border-bleu {
        border: 1px solid var(--blue-ecume-850-200);
      }

      &.progress--border-gris-moyen {
        border: 1px solid #bababa;
      }

      &::-webkit-progress-bar {
        border-radius: 0.375rem;
      }

      &::-webkit-progress-value {
        border-radius: 0.375rem;
      }

      &::-moz-progress-bar {
        border-radius: 0.375rem;
      }

      &.progress--primaire {
        &::-moz-progress-bar {
          background-color: var(--background-action-high-blue-france);
        }

        &::-webkit-progress-value {
          background-color: var(--background-action-high-blue-france);
        }
      }

      &.progress--bleu-clair {
        &::-moz-progress-bar {
          background-color: var(--background-flat-info);
        }

        &::-webkit-progress-value {
          background-color: var(--background-flat-info);
        }
      }

      &.progress--bleu-dsfr-info {
        &::-moz-progress-bar {
          background-color: #0078f3;
        }

        &::-webkit-progress-value {
          background-color: #0078f3;
        }
      }

      &.progress--grey-dsfr {
        &::-moz-progress-bar {
          background-color: #3a3a3a;
        }

        &::-webkit-progress-value {
          background-color: #3a3a3a;
        }
      }

      &.progress--primaire-light {
        &::-moz-progress-bar {
          background-color: var(--blue-france-sun-113-625);
        }

        &::-webkit-progress-value {
          background-color: var(--blue-france-sun-113-625);
        }
      }

      &.progress--secondaire {
        &::-moz-progress-bar {
          background-color: #666;
        }

        &::-webkit-progress-value {
          background-color: #666;
        }
      }

      &.progress--secondaire-light {
        &::-moz-progress-bar {
          background-color: #929292;
        }

        &::-webkit-progress-value {
          background-color: #929292;
        }
      }

      &.progress--rose {
        &::-moz-progress-bar {
          background-color: var(--background-action-high-pink-tuile);
        }

        &::-webkit-progress-value {
          background-color: var(--background-action-high-pink-tuile);
        }
      }

      &.progress--jaune-moutarde {
        &::-moz-progress-bar {
          background-color: var(--yellow-moutarde-main-679) !important;
        }

        &::-webkit-progress-value {
          background-color: var(--yellow-moutarde-main-679) !important;
        }
      }
    }
  }

  .pourcentage {
    &.pourcentage--bleu {
      color: var(--blue-ecume-850-200);
    }

    &.pourcentage--bleu-clair {
      color: var(--background-flat-info);
    }

    &.pourcentage--blanc {
      color: #fff;
    }

    &.pourcentage--gris-moyen {
      color: #bababa;
    }

    &.pourcentage--gris-clair {
      color: #e5e5e5;
    }
  }

  &.texte-côté {
    flex-direction: row;
    align-items: center;

    .barre {
      flex-grow: 1;
    }

    .pourcentage {
      &.pourcentage--xxs {
        width: 2.5rem;
      }

      &.pourcentage--xs {
        width: 2.5rem;
      }

      &.pourcentage--sm {
        width: 2.5rem;
      }

      &.pourcentage--md {
        width: 2.5rem;
      }

      &.pourcentage--lg {
        width: 6.5rem;
      }

      p {
        padding-left: 0.5em;
        text-align: right;
        white-space: nowrap;
        vertical-align: middle;
      }
    }
  }

  &.texte-dessus {
    flex-direction: column-reverse;
  }
`;

export default BarreDeProgressionStyled;
