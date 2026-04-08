export const chatMarkdownStyles = `
  .albert-markdown h1, .albert-markdown h2, .albert-markdown h3 {
    font-weight: 700;
    margin-top: 0.75em;
    margin-bottom: 0.25em;
    line-height: 1.5;
  }
  .albert-markdown h1 { font-size: 1.25em; }
  .albert-markdown h2 { font-size: 1.1em; }
  .albert-markdown h3 { font-size: 1em; }
  .albert-markdown p { margin: 0.7em 0; }
  .albert-markdown ul, .albert-markdown ol {
    padding-left: 1.5em;
    margin: 0.5em 0;
  }
  .albert-markdown ul { list-style: disc; }
  .albert-markdown ol { list-style: decimal; }
  .albert-markdown li { margin: 0.25em 0; }
  .albert-markdown table {
    border-collapse: collapse;
    width: 100%;
    margin: 0.75em 0;
    font-size: 1rem;
  }
  .albert-markdown th, .albert-markdown td {
    border: 1px solid #d1d5db;
    padding: 0.5em 0.75em;
    text-align: left;
  }
  .albert-markdown th {
    background: #f3f4f6;
    font-weight: 600;
  }
  .albert-markdown code {
    background: #f3f4f6;
    padding: 0.15em 0.4em;
    border-radius: 0.25em;
    font-size: 0.9em;
  }
  .albert-markdown pre {
    background: #1f2937;
    color: #f9fafb;
    padding: 0.75em 1em;
    border-radius: 0.375em;
    overflow-x: auto;
    margin: 0.75em 0;
  }
  .albert-markdown pre code {
    background: transparent;
    padding: 0;
  }
  .albert-markdown strong { font-weight: 700; }
  .albert-markdown blockquote {
    border-left: 3px solid #d1d5db;
    padding-left: 0.75em;
    margin: 0.5em 0;
    color: #6b7280;
  }
  .albert-markdown hr {
    margin: 2rem 0 !important;
    padding: 1px;
  }
  .albert-markdown > p,
  .albert-markdown > h1,
  .albert-markdown > h2,
  .albert-markdown > h3,
  .albert-markdown > ul,
  .albert-markdown > ol,
  .albert-markdown > table,
  .albert-markdown > pre,
  .albert-markdown > blockquote,
  .albert-markdown > hr,
  .albert-markdown li {
    animation: md-fade-in 300ms ease-out;
  }
  @keyframes md-fade-in {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
