import styled from '@emotion/styled';

export const breakpointL = '992px';

const MiseEnPageStyled = styled.div`
  word-break: break-word;

  @media print {
    @page {
      margin: 1.5cm 1cm;
    }
    
    .barre-latérale, .fr-btn, .fr-link, .fr-header, .fr-footer {
      display: none !important;
    }
    
    *::-webkit-scrollbar {
      display: none;
    }
    
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    
    main {
      background: #fff !important;
    }
  }
  
  main {
    flex-grow: 1;
    background:  var(--background-alt-blue-france);

    h1 {
      color: var(--text-title-blue-france);
    }
  }

  .toaster-chargement {
    position: fixed;
    right: 4rem;
    bottom: 4rem;
    z-index: 10;
    width: 20rem;
    background-color: var(--background-alt-overlap-grey);
    filter: drop-shadow(var(--overlap-shadow));
    box-shadow: inset 0 0 0 1px var(--border-default-grey);
    
    .toaster-texte {
      padding: 1rem;
      margin: 0;
    }
    
    .progress {
      position: relative;
      width: 100%;
      height: 0.4em;
      background-color: rgb(229 233 235);
    }
    
    .progress-bar-green {
      position: relative;
      height: 100%;
      background-color: #3c763d;
      background-size: 23em 0.25em;
      animation: cssload-width 1s ease-out 1;
    }
  }

  @keyframes cssload-width {
    0%, 100% {
      transition-timing-function: cubic-bezier(1, 0, 0.65, 0.85);
    }
    
    0% { /* stylelint-disable-line keyframe-block-no-duplicate-selectors */
      width: 0;
    }
    
    100% { /* stylelint-disable-line keyframe-block-no-duplicate-selectors */
      width: 100%;
    }
  }

  @keyframes cssload-width {
    0%, 100% {
      transition-timing-function: cubic-bezier(1, 0, 0.65, 0.85);
    }
    
    0% { /* stylelint-disable-line keyframe-block-no-duplicate-selectors */
      width: 0;
    }
    
    100% { /* stylelint-disable-line keyframe-block-no-duplicate-selectors */
      width: 100%;
    }
  }

  @keyframes cssload-width {
    0%, 100% {
      transition-timing-function: cubic-bezier(1, 0, 0.65, 0.85);
    }
    
    0% { /* stylelint-disable-line keyframe-block-no-duplicate-selectors */
      width: 0;
    }
    
    100% { /* stylelint-disable-line keyframe-block-no-duplicate-selectors */
      width: 100%;
    }
  }

  @keyframes cssload-width {
    0%, 100% {
      transition-timing-function: cubic-bezier(1, 0, 0.65, 0.85);
    }
    
    0% { /* stylelint-disable-line keyframe-block-no-duplicate-selectors */
      width: 0;
    }
    
    100% { /* stylelint-disable-line keyframe-block-no-duplicate-selectors */
      width: 100%;
    }
  }

  @keyframes cssload-width {
    0%, 100% {
      transition-timing-function: cubic-bezier(1, 0, 0.65, 0.85);
    }
    
    0% { /* stylelint-disable-line keyframe-block-no-duplicate-selectors */
      width: 0;
    }
    
    100% { /* stylelint-disable-line keyframe-block-no-duplicate-selectors */
      width: 100%;
    }
  }
`;

export default MiseEnPageStyled;
