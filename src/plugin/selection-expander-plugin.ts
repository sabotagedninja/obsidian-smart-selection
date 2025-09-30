import { Editor, MarkdownView, Plugin } from 'obsidian';
import SelectionExpanderPluginImpl from 'src/plugin/selection-expander-plugin-impl';

export default class SelectionExpanderPlugin extends Plugin {

  async onload() {

    this.addCommand({
      id: 'expand-selection-cyclic',
      name: 'Expand selection: caret → line → paragraph → document',
      callback: () => this.expandSelectionCycle(),
      hotkeys: [
        {
          modifiers: ['Mod'],
          key: 'a'
        }
      ]
    });

    // Optional: also register a reverse shrink command
    this.addCommand({
      id: 'shrink-selection-cyclic',
      name: 'Shrink selection (reverse cycle)',
      callback: () => this.shrinkSelectionCycle(),
      hotkeys: [
        {
          modifiers: ['Mod', 'Shift'],
          key: 'a'
        }
      ]
    });
  }

  onunload() {
    // nothing special
  }


  
  private impl = new SelectionExpanderPluginImpl();

  private getActiveEditor(): Editor | null {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) return null;
    return (view as MarkdownView).editor;
  }

  private expandSelectionCycle(): void {
    const editor = this.getActiveEditor();
    if (!editor)
      return;
    this.impl.setEditor(editor);
    this.impl.expandSelectionCycle();
  }

  private shrinkSelectionCycle(): void {
    const editor = this.getActiveEditor();
    if (!editor)
      return;
    this.impl.setEditor(editor);
    this.impl.shrinkSelectionCycle();
  }
}
