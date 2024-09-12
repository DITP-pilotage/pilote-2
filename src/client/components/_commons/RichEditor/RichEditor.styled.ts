import styled from '@emotion/styled';

const RichEditorStyled = styled.section`
  .other h2 {
    font-size: 18px;
    color: #444;
    margin-bottom: 7px;
  }

  .other a {
    color: #777;
    text-decoration: underline;
    font-size: 14px;
  }

  .other ul {
    padding: 0;
    margin: 0;
    list-style-type: none;
  }

  .App {
    font-family: sans-serif;
    text-align: center;
  }

  h1 {
    font-size: 24px;
    color: #333;
  }

  .ltr {
    text-align: left;
  }

  .rtl {
    text-align: right;
  }

  .editor-container {
    margin: 20px auto 20px auto;
    border-radius: 2px;
    max-width: 600px;
    color: #000;
    position: relative;
    line-height: 20px;
    font-weight: 400;
    text-align: left;
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
  }

  .editor-inner {
    background: #fff;
    position: relative;
  }

  .editor-input {
    min-height: 150px;
    resize: none;
    font-size: 15px;
    caret-color: rgb(5, 5, 5);
    position: relative;
    tab-size: 1;
    outline: 0;
    padding: 15px 10px;
    caret-color: #444;
  }

  .editor-placeholder {
    color: #999;
    overflow: hidden;
    position: absolute;
    text-overflow: ellipsis;
    top: 15px;
    left: 10px;
    font-size: 15px;
    user-select: none;
    display: inline-block;
    pointer-events: none;
  }

  .editor-text-bold {
    font-weight: bold;
  }

  .editor-text-italic {
    font-style: italic;
  }

  .editor-text-underline {
    text-decoration: underline;
  }

  .editor-text-strikethrough {
    text-decoration: line-through;
  }

  .editor-text-underlineStrikethrough {
    text-decoration: underline line-through;
  }

  .editor-text-code {
    background-color: rgb(240, 242, 245);
    padding: 1px 0.25rem;
    font-family: Menlo, Consolas, Monaco, monospace;
    font-size: 94%;
  }

  .editor-link {
    color: rgb(33, 111, 219);
    text-decoration: none;
  }

  .tree-view-output {
    display: block;
    background: #222;
    color: #fff;
    padding: 5px;
    font-size: 12px;
    white-space: pre-wrap;
    margin: 1px auto 10px auto;
    max-height: 250px;
    position: relative;
    border-bottom-left-radius: 10px;
    border-bottom-right-radius: 10px;
    overflow: auto;
    line-height: 14px;
  }

  .editor-code {
    background-color: rgb(240, 242, 245);
    font-family: Menlo, Consolas, Monaco, monospace;
    display: block;
    padding: 8px 8px 8px 52px;
    line-height: 1.53;
    font-size: 13px;
    margin: 0;
    margin-top: 8px;
    margin-bottom: 8px;
    tab-size: 2;
    /* white-space: pre; */
    overflow-x: auto;
    position: relative;
  }

  .editor-code:before {
    content: attr(data-gutter);
    position: absolute;
    background-color: #eee;
    left: 0;
    top: 0;
    border-right: 1px solid #ccc;
    padding: 8px;
    color: #777;
    white-space: pre-wrap;
    text-align: right;
    min-width: 25px;
  }
  .editor-code:after {
    content: attr(data-highlight-language);
    top: 0;
    right: 3px;
    padding: 3px;
    font-size: 10px;
    text-transform: uppercase;
    position: absolute;
    color: rgba(0, 0, 0, 0.5);
  }

  .editor-tokenComment {
    color: slategray;
  }

  .editor-tokenPunctuation {
    color: #999;
  }

  .editor-tokenProperty {
    color: #905;
  }

  .editor-tokenSelector {
    color: #690;
  }

  .editor-tokenOperator {
    color: #9a6e3a;
  }

  .editor-tokenAttr {
    color: #07a;
  }

  .editor-tokenVariable {
    color: #e90;
  }

  .editor-tokenFunction {
    color: #dd4a68;
  }

  .editor-paragraph {
    margin: 0;
    margin-bottom: 8px;
    position: relative;
  }

  .editor-paragraph:last-child {
    margin-bottom: 0;
  }

  .editor-heading-h1 {
    font-size: 24px;
    color: rgb(5, 5, 5);
    font-weight: 400;
    margin: 0;
    margin-bottom: 12px;
    padding: 0;
  }

  .editor-heading-h2 {
    font-size: 15px;
    color: rgb(101, 103, 107);
    font-weight: 700;
    margin: 0;
    margin-top: 10px;
    padding: 0;
    text-transform: uppercase;
  }

  .editor-quote {
    margin: 0;
    margin-left: 20px;
    font-size: 15px;
    color: rgb(101, 103, 107);
    border-left-color: rgb(206, 208, 212);
    border-left-width: 4px;
    border-left-style: solid;
    padding-left: 16px;
  }

  .editor-list-ol {
    padding: 0;
    margin: 0;
    margin-left: 16px;
  }

  .editor-list-ul {
    padding: 0;
    margin: 0;
    margin-left: 16px;
  }

  .editor-listitem {
    margin: 8px 32px 8px 32px;
  }

  .editor-nested-listitem {
    list-style-type: none;
  }

  pre::-webkit-scrollbar {
    background: transparent;
    width: 10px;
  }

  pre::-webkit-scrollbar-thumb {
    background: #999;
  }

  .debug-timetravel-panel {
    overflow: hidden;
    padding: 0 0 10px 0;
    margin: auto;
    display: flex;
  }

  .debug-timetravel-panel-slider {
    padding: 0;
    flex: 8;
  }

  .debug-timetravel-panel-button {
    padding: 0;
    border: 0;
    background: none;
    flex: 1;
    color: #fff;
    font-size: 12px;
  }

  .debug-timetravel-panel-button:hover {
    text-decoration: underline;
  }

  .debug-timetravel-button {
    border: 0;
    padding: 0;
    font-size: 12px;
    top: 10px;
    right: 15px;
    position: absolute;
    background: none;
    color: #fff;
  }

  .debug-timetravel-button:hover {
    text-decoration: underline;
  }

  .toolbar {
    display: flex;
    margin-bottom: 1px;
    background: #fff;
    padding: 4px;
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
    vertical-align: middle;
  }

  .toolbar button.toolbar-item {
    border: 0;
    display: flex;
    background: none;
    border-radius: 10px;
    padding: 8px;
    cursor: pointer;
    vertical-align: middle;
  }

  .toolbar button.toolbar-item:disabled {
    cursor: not-allowed;
  }

  .toolbar button.toolbar-item.spaced {
    margin-right: 2px;
  }

  .toolbar button.toolbar-item i.format {
    background-size: contain;
    display: inline-block;
    height: 18px;
    width: 18px;
    margin-top: 2px;
    vertical-align: -0.25em;
    display: flex;
    opacity: 0.6;
  }

  .toolbar button.toolbar-item:disabled i.format {
    opacity: 0.2;
  }

  .toolbar button.toolbar-item.active {
    background-color: rgba(223, 232, 250, 0.3);
  }

  .toolbar button.toolbar-item.active i {
    opacity: 1;
  }

  .toolbar .toolbar-item:hover:not([disabled]) {
    background-color: #eee;
  }

  .toolbar .divider {
    width: 1px;
    background-color: #eee;
    margin: 0 4px;
  }

  .toolbar .toolbar-item .text {
    display: flex;
    line-height: 20px;
    width: 200px;
    vertical-align: middle;
    font-size: 14px;
    color: #777;
    text-overflow: ellipsis;
    width: 70px;
    overflow: hidden;
    height: 20px;
    text-align: left;
  }

  .toolbar .toolbar-item .icon {
    display: flex;
    width: 20px;
    height: 20px;
    user-select: none;
    margin-right: 8px;
    line-height: 16px;
    background-size: contain;
  }

  i.undo {
    background-image: url(icons/arrow-counterclockwise.svg);
  }

  i.redo {
    background-image: url(icons/arrow-clockwise.svg);
  }

  i.bold {
    background-image: url(icons/type-bold.svg);
  }

  i.italic {
    background-image: url(icons/type-italic.svg);
  }

  i.underline {
    background-image: url(icons/type-underline.svg);
  }

  i.strikethrough {
    background-image: url(icons/type-strikethrough.svg);
  }

  i.left-align {
    background-image: url(icons/text-left.svg);
  }

  i.center-align {
    background-image: url(icons/text-center.svg);
  }

  i.right-align {
    background-image: url(icons/text-right.svg);
  }

  i.justify-align {
    background-image: url(icons/justify.svg);
  }
`;

export default RichEditorStyled;
