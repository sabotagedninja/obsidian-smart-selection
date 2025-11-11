import { Plugin, MarkdownView, Editor } from 'obsidian';
import SmartSelectionDelegate from './smart-selection-delegate';

export default class SmartSelectionPlugin extends Plugin {

  private impl = new SmartSelectionDelegate();
  
  async onload() {
    console.debug('Loading plugin: Smart Selection');

    this.addCommand({
      id: 'expand',
      name: 'Expand selection',
      callback: () => this.expandSelection()
    });

    this.addCommand({
      id: 'shrink',
      name: 'Shrink selection',
      callback: () => this.shrinkSelection()
    });
  }

  private getActiveEditor(): Editor | null {
    return this.app.workspace.getActiveViewOfType(MarkdownView)?.editor ?? null;
  }

  private expandSelection(): void {
    const editor = this.getActiveEditor();
    if (editor) {
      this.impl.setEditor(editor);
      this.impl.expandSelection();
    } else {
      console.error('No active Editor');
    }
  }

  private shrinkSelection(): void {
    const editor = this.getActiveEditor();
    if (editor) {
      this.impl.setEditor(editor);
      this.impl.shrinkSelection();
    } else {
      console.error('No active Editor');
    }
  }
}
