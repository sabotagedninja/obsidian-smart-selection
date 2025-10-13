import { Editor, MarkdownView, Plugin } from 'obsidian';
import SmartSelectionPluginImpl from './smart-selection-plugin-impl';

export default class SmartSelectionPlugin extends Plugin {

  async onload() {

    this.addCommand({
      id: 'smart-selection-expand',
      name: 'Expand selection',
      callback: () => this.expandSelection()
      // Not allowd to provide a default hotkey
      // I propose Ctrl + A
    });

    this.addCommand({
      id: 'smart-selection-shrink',
      name: 'Shrink selection',
      callback: () => this.shrinkSelection()
      // Not allowd to provide a default hotkey
      // I propose Ctrl + Shift + A
    });
  }

  private impl = new SmartSelectionPluginImpl();

  private getActiveEditor(): Editor | null {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) return null;
    return (view as MarkdownView).editor;
  }

  private expandSelection(): void {
    const editor = this.getActiveEditor();
    if (!editor) return;
    this.impl.setEditor(editor);
    this.impl.expandSelection();
  }

  private shrinkSelection(): void {
    const editor = this.getActiveEditor();
    if (!editor) return;
    this.impl.setEditor(editor);
    this.impl.shrinkSelection();
  }
}
