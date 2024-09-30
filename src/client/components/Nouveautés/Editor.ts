import {
  AnchorTune,
  BoldInlineTool,
  DeleteTune,
  HeaderInlineTool,
  ItalicInlineTool,
  LangInlineTool,
  LinkInlineTool,
  ListInlineTool,
  MoveDownTune,
  MoveUpTune,
  SvelteEditor,
  UnderlineInlineTool,
} from '@/client/utils/svelte-editor/svelte-editor.mjs';

import {
  SvelteAccordion,
  SvelteAttachment,
  SvelteButton,
  SvelteCallout,
  SvelteFaq,
  SvelteHeader,
  SvelteHighlight,
  SvelteIframe,
  SvelteImage,
  SvelteLink,
  SvelteParagraph,
  SvelteQuote,
  SvelteRecommendation,
} from '@/client/utils/svelte-editor/svelte-editor-plugins.mjs';

export class Editor {
  private _editor: SvelteEditor;

  constructor() {
    this._editor = new SvelteEditor({
      holder: 'editorjs',
      autofocus: true,
      defaultBlock: 'paragraph',
      tunes: ['moveUp', 'moveDown', 'delete'],
      tools: {
        delete: DeleteTune,
        moveUp: MoveUpTune,
        moveDown: MoveDownTune,
        bold: BoldInlineTool,
        italic: ItalicInlineTool,
        underline: UnderlineInlineTool,
        link: LinkInlineTool,
        list: ListInlineTool,
        lang: LangInlineTool,
        anchor: AnchorTune,
        header: {
          class: HeaderInlineTool,
          config: { levels: ['h2', 'h3', 'h4', 'h5', 'h6'] },
        },
        faq: SvelteFaq,
        Recommendation: {
          class: SvelteRecommendation,
          config: {
            type: 'plugin',
            source: 'http://bo-pmv7.docker/admin/editor/search',
          },
        },
        paragraph: {
          class: SvelteParagraph,
          inlineToolbar: ['bold', 'italic', 'underline', 'list', 'link', 'lang'],
          tunes: ['anchor', 'moveUp', 'moveDown', 'delete'],
          config: {
            type: 'text',
          },
        },
        Headers: {
          class: SvelteHeader,
          tunes: ['anchor', 'moveUp', 'moveDown', 'delete'],
          config: {
            levels: [2, 3, 4, 5, 6],
            type: 'text',
          },
        },
        Accordion: {
          class: SvelteAccordion,
          inlineToolbar: ['bold', 'italic', 'link', 'list', 'header'],
          config: {
            type: 'widget',
            sanitizerConfig: {
              br: true,
              b: {},
              i: {},
              ul: {},
              ol: {},
              li: {},
              h2: {},
              h3: {},
              h4: {},
              h5: {},
              h6: {},
              p: {},
              a: { href: true, target: true },
            },
          },
        },
        Buttons: {
          class: SvelteButton,
          config: { type: 'widget' },
        },
        Quotes: {
          class: SvelteQuote,
          inlineToolbar: ['bold', 'italic'],
          config: { type: 'widget', sanitizerConfig: { b: {}, i: {} } },
        },
        Links: { class: SvelteLink, config: { type: 'widget' } },
        MiseEnAvants: {
          class: SvelteCallout,
          config: { type: 'widget' },
        },
        Exergues: { class: SvelteHighlight, config: { type: 'widget' } },
        Attachment: {
          class: SvelteAttachment,
          config: { type: 'widget' },
        },
        Image: {
          class: SvelteImage,
          inlineToolbar: ['bold', 'italic', 'link', 'list', 'header'],
          config: {
            type: 'media',
            fit: 'contain',
            endpoints: { byFile: '', byUrl: '' },
            sanitizerConfig: {
              br: true,
              b: {},
              i: {},
              ul: {},
              ol: {},
              li: {},
              h2: {},
              h3: {},
              h4: {},
              h5: {},
              h6: {},
              p: {},
              a: { href: true, target: true },
            },
          },
        },
        Iframe: {
          class: SvelteIframe,
          config: { type: 'plugin' },
        },
      },
    });
  }

  async afficherJSON() {
    console.log(await this._editor.save());
  }
}
