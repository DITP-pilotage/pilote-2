import styled from '@emotion/styled';

export const ÉditeurRicheStyled = styled.div`
  .ProseMirror {
    min-height: 200px;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 1rem;
    outline: none;

    > * + * {
      margin-top: 0.75em;
    }

    ul,
    ol {
      padding: 0 1rem;
    }

    p {
      margin-bottom: 0;
    }

    h4 {
      margin-bottom: .5rem!important;
      margin-top: .5rem!important;
    }


    hr {
      margin-top: .5rem;
      margin-bottom: .5rem;
    }

    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      line-height: 1.1;
    }

    code {
      background-color: rgba(97, 97, 97, 0.1);
      color: #616161;
      padding: 0.2em 0.4em;
      border-radius: 3px;
    }

    pre {
      background: #0d0d0d;
      color: #fff;
      font-family: 'JetBrainsMono', monospace;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;

      code {
        color: inherit;
        padding: 0;
        background: none;
        font-size: 0.8rem;
      }
    }

    img {
      max-width: 100%;
      height: auto;
    }

    blockquote {
      padding-left: 1rem;
      border-left: 2px solid rgba(13, 13, 13, 0.1);
    }

    hr {
      border: none;
      border-top: 2px solid rgba(13, 13, 13, 0.1);
      margin: 2rem 0;
    }

    a {
      color: #0063cb;
      text-decoration: underline;
    }
  }

  .ProseMirror-focused {
    border-color: #0063cb;
  }
`; 
