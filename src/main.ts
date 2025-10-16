import { Plugin, MarkdownView, Editor } from 'obsidian';
import SmartSelectionDelegate from './smart-selection-delegate';
import { setLoggingEnabled } from './dev-utils';

export default class SmartSelectionPlugin extends Plugin {

  private LOGGING_ENABLED = false; // Disabled for production builds

  private impl = new SmartSelectionDelegate();
  
  async onload() {
    console.log('Loading plugin: Smart Selection');

    setLoggingEnabled(this.LOGGING_ENABLED);

    this.addCommand({
      id: 'smart-selection-expand',
      name: 'Expand selection',
      callback: () => this.expandSelection()
    });

    this.addCommand({
      id: 'smart-selection-shrink',
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
