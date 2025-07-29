import styled from "@emotion/styled";

const InputGroupeStyled = styled.div`
  position: relative;

  div[role="menu"] {
    display: none;
  }

  div[role="menu"].visible {
    position: absolute;
    z-index: 2;
    display: block;
    width: 100%;
    max-height: 20rem;
    overflow: auto;
    background: white;
    border: 1px solid grey;
  }

  button.fr-select {
    text-align: left;
  }

  .list-territoire-titre {
    color: var(--text-mention-grey);
    border-top: 1px solid black;
  }

  .list-territoire {
    padding: 0;
    list-style: none;
  }

  .territoire-item-nat,
  .list-territoire-item {
    --idle: transparent;
    --hover: var(--background-alt-grey-hover);
    --active: var(--background-alt-grey-active);

    background-color: var(--background-alt-grey);
  }

  .list-territoire .list-territoire-item:nth-of-type(2n) {
    --idle: transparent;
    --hover: var(--background-contrast-grey-hover);
    --active: var(--background-contrast-grey-active);

    background-color: var(--background-contrast-grey);
  }
`;

export default InputGroupeStyled;
