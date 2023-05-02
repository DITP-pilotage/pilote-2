import styled from '@emotion/styled';

const ExplicationEtapeIndicateurStyled = styled.div`
    background-color: #FFF;
    border: 1px solid var(--border-default-grey);
    height: 100%;
    
    .explication-indicateur__numero {
        --diamètre: 2rem;

        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--background-action-high-blue-france);
        color: #FFF;
        height: var(--diamètre);
        width: var(--diamètre);
        border-radius: var(--diamètre);

        &::before,
        &::after {
            position: absolute;
            content: '';
            display: block;
            height: .5rem;
            background-color: var(--background-action-high-blue-france);
            border-radius: var(--diamètre);
        }

        &::before {
            width: var(--diamètre);
            left: calc(var(--diamètre) - .5rem);
        }

        &::after {
            width: .5rem;
            left: calc(var(--diamètre) * 2);
        }
    }
`;

export default ExplicationEtapeIndicateurStyled;
