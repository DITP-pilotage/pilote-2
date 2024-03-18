import styled from '@emotion/styled';

const JaugeDeProgressionStyled = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;


  .jauge-tracé--sm {
    width: 3.75rem;
  }

  .jauge-tracé--md {
    width: 5.5rem;
  }

  .jauge-tracé--lg {
    width: 10.5rem;
  }

  .jauge-tracé {
    position: relative;

    .jauge-valeur {
      &.jauge-valeur--bleu {
        color: var(--background-active-blue-france);
      }

      &.jauge-valeur--bleu-clair {
        color: var(--background-flat-info);
      }

      &.jauge-valeur--violet {
        color: #8585F6;
      }

      &.jauge-valeur--orange {
        color: #FC5D00;
      }

      &.jauge-valeur--vert {
        color: #27A658;
      }

      &.jauge-valeur--rose {
        color: var(--background-action-high-pink-tuile);
      }

      margin-bottom: 0;
      word-break: normal;

      &.jauge-valeur-au-centre {
        position: absolute;
        top: calc(50% - 1.4rem);
        width: 100%;
        line-height: 2.5rem !important;
      }
    }

    .jauge-barre-fond {
      fill: #d9d9d9;
    }

    .jauge-barre-valeur--bleu {
      fill: var(--background-active-blue-france);
    }

    .jauge-barre-valeur--bleu-clair {
      fill: var(--background-flat-info);
    }

    .jauge-barre-valeur--violet {
      fill: #8585F6;
    }

    .jauge-barre-valeur--orange {
      fill: #FC5D00;
    }

    .jauge-barre-valeur--vert {
      fill: #27A658;
    }

    .jauge-barre-valeur--rose {
      fill: var(--background-action-high-pink-tuile);
    }
  }

  @media screen and (max-width: 80rem) {
    .jauge-tracé--sm {
      width: 3.75rem;
    }

    .jauge-tracé--md {
      width: 4rem;
    }

    .jauge-tracé--lg {
      width: 8.25rem;
    }
  }
`;

export default JaugeDeProgressionStyled;
