/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { TreeView } from '@lexical/react/LexicalTreeView';

export default function TreeViewPlugin(): JSX.Element {
  const [editor] = useLexicalComposerContext();
  return (
    <TreeView
      editor={editor}
      timeTravelButtonClassName='debug-timetravel-button'
      timeTravelPanelButtonClassName='debug-timetravel-panel-button'
      timeTravelPanelClassName='debug-timetravel-panel'
      timeTravelPanelSliderClassName='debug-timetravel-panel-slider'
      treeTypeButtonClassName='debug-treetype-button'
      viewClassName='tree-view-output'
    />
  );
}
