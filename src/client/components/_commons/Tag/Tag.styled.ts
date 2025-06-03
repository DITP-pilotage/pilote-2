import styled from '@emotion/styled';

const TagStyled = styled.span`
  color: white;

  &.blue-france { 
    background-color: var(--blue-france-sun-113-625);
  }

  &.blue-info-main {
    background-color: #0078f3;
  }

  &.warning {
    background-color: var(--warning-425-625);
    }

  &.yellow-moutarde {
    color: black;
    background-color: var(--yellow-moutarde-850-200);
  }

  &.red-cranberry {
    background-color: var(--red-cranberry-850-200);
  }

  &.fr-tag--fixed-width {
    max-width: 30ch;
    
    & span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
`;

export default TagStyled;
