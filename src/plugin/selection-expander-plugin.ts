import { Editor, MarkdownView, Plugin } from 'obsidian';
import SelectionExpanderPluginImpl from 'src/plugin/selection-expander-plugin-impl';

export default class SelectionExpanderPlugin extends Plugin {

  async onload() {

    this.addCommand({
      id: 'smart-select-expand',
      name: 'Expand selection: caret → line → paragraph → document',
      callback: () => this.expandSelection(),
      hotkeys: [
        {
          modifiers: ['Mod'],
          key: 'a'
        }
      ]
    });

    this.addCommand({
      id: 'smart-select-shrink',
      name: 'Shrink selection (reverse cycle)',
      callback: () => this.shrinkSelection(),
      hotkeys: [
        {
          modifiers: ['Mod', 'Shift'],
          key: 'a'
        }
      ]
    });
  }

  private impl = new SelectionExpanderPluginImpl();

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
