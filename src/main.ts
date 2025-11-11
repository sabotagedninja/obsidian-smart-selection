import { Plugin, MarkdownView, Editor } from 'obsidian';
import { EditorView } from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import SmartSelectionDelegate from './smart-selection-delegate';
import { setLoggingEnabled } from './dev-utils';
import { buildSmartSelectionGraph, Graph, Node } from './ast-processor';

export default class SmartSelectionPlugin extends Plugin {

  private LOGGING_ENABLED = false; // Disabled for production builds

  private impl = new SmartSelectionDelegate();
  
  async onload() {
    console.log('Loading plugin: Smart Selection');

    // setLoggingEnabled(this.LOGGING_ENABLED);

    this.addCommand({
      id: 'smart-selection-expand',
      name: 'Expand selection',
      editorCallback: (editor: Editor, view: MarkdownView) => this.expandSelection(editor, view),
      // editorCheckCallback: (checking: boolean, editor: Editor, ctx: MarkdownView) => {},
    });

    this.addCommand({
      id: 'smart-selection-shrink',
      name: 'Shrink selection',
      editorCallback: (editor: Editor, view: MarkdownView) => this.shrinkSelection(editor, view),
      // editorCheckCallback: (checking: boolean, editor: Editor, ctx: MarkdownView) => {},
    });
  }

  private expandSelection(editor: Editor, view: MarkdownView): void {
    const graph = this.buildGraph(editor);
    this.impl.setEditor(editor);
    this.impl.setGraph(graph);
    this.impl.expandSelection();
  }
  
  private shrinkSelection(editor: Editor, view: MarkdownView): void {
    const graph = this.buildGraph(editor);
    this.impl.setEditor(editor);
    this.impl.setGraph(graph);
    this.impl.shrinkSelection();
  }

  private buildGraph(editor: Editor): Graph | null {
    console.log('');
    console.log('');
    console.log('==========================================================');
    console.log('');
    console.log('');

    // Build a custom graph representation of the document's structure
    // using the syntax tree from CodeMirror 6 for more context-aware selection expansion. 
    // TODO only build this once per document change, not every time the user expands selection.
    const graph = buildSmartSelectionGraph(editor);
    if (!graph) {
      console.warn('Smart Selection: Unable to build document graph.');
      return null;
    }
    
    console.log('');
    console.log('');
    console.log('----------------------------------------------------------');
    console.log('');
    console.log('');

    console.log('Graph:', graph);

    return graph;
  }
}
