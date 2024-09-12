import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { FunctionComponent } from 'react';
import ToolbarPlugin from '@/components/_commons/RichEditor/plugins/ToolbarPlugin';
import TreeViewPlugin from '@/components/_commons/RichEditor/plugins/TreeViewPlugin';
import RichEditorStyled from '@/components/_commons/RichEditor/RichEditor.styled';

const theme = {
  code: 'editor-code',
  heading: {
    h1: 'editor-heading-h1',
    h2: 'editor-heading-h2',
    h3: 'editor-heading-h3',
    h4: 'editor-heading-h4',
    h5: 'editor-heading-h5',
  },
  image: 'editor-image',
  link: 'editor-link',
  list: {
    listitem: 'editor-listitem',
    nested: {
      listitem: 'editor-nested-listitem',
    },
    ol: 'editor-list-ol',
    ul: 'editor-list-ul',
  },
  ltr: 'ltr',
  paragraph: 'editor-paragraph',
  placeholder: 'editor-placeholder',
  quote: 'editor-quote',
  rtl: 'rtl',
  text: {
    bold: 'editor-text-bold',
    code: 'editor-text-code',
    hashtag: 'editor-text-hashtag',
    italic: 'editor-text-italic',
    overflowed: 'editor-text-overflowed',
    strikethrough: 'editor-text-strikethrough',
    underline: 'editor-text-underline',
    underlineStrikethrough: 'editor-text-underlineStrikethrough',
  },
};

const placeholder = 'Enter some rich text...';

const editorConfig = {
  namespace: 'React.js Demo',
  nodes: [],
  // Handling of errors during update
  onError(error: Error) {
    throw error;
  },
  // The editor theme
  theme,
};

const RichEditor: FunctionComponent<{}> = () => {
  return (
    <RichEditorStyled>
      <LexicalComposer initialConfig={editorConfig}>
        <div className='editor-container'>
          <ToolbarPlugin />
          <div className='editor-inner'>
            <RichTextPlugin
              ErrorBoundary={LexicalErrorBoundary}
              contentEditable={
                <ContentEditable
                  aria-placeholder={placeholder}
                  className='editor-input'
                  placeholder={
                    <div className='editor-placeholder'>
                      {placeholder}
                    </div>
                  }
                />
              }
            />
            <HistoryPlugin />
            <AutoFocusPlugin />
            <TreeViewPlugin />
          </div>
        </div>
      </LexicalComposer>
    </RichEditorStyled>
  );
};

export default RichEditor;
