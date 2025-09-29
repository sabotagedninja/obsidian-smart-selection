// Obsidian Selection Expander
// Single-file draft plugin.
// Install: put compiled JS and manifest into a plugin folder per Obsidian docs.

import { App, Editor, MarkdownView, EditorPosition, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import SelectionExpanderLogic from './selection-expander-logic';

interface SelectionExpanderPluginSettings {
  mySetting: string;
}

const DEFAULT_SETTINGS: SelectionExpanderPluginSettings = {
  mySetting: 'default'
}

type SelectionState = {
      selection: string,
      from: number,
      to: number,
      anchor: number,
      lineRange: SelectionRange,
      paragraphRange: SelectionRange,
      documentRange: SelectionRange,
}

type SelectionRange = {
  start: number;
  end: number;
};

export default class SelectionExpanderPlugin extends Plugin {
  settings: SelectionExpanderPluginSettings;

  async onload() {

    this.addCommand({
      id: 'expand-selection-cyclic',
      name: 'Expand selection: caret → line → paragraph → document',
      callback: () => this.expandSelectionCycle(),
      hotkeys: [
        {
          modifiers: ["Mod"],
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
          modifiers: ["Mod", "Shift"],
          key: 'a'
        }
      ]
    });
  }

  onunload() {
    // nothing special
  }

  
  
  private impl = new SelectionExpanderLogic();

  private expandSelectionCycle() {
    const editor = this.getActiveEditor();
    if (!editor)
      return;
    this.impl.expandSelectionCycle(editor);
  }

  private shrinkSelectionCycle() {
    const editor = this.getActiveEditor();
    if (!editor)
      return;
    this.impl.shrinkSelectionCycle(editor);
  }

  private getActiveEditor(): Editor | null {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) return null;
    return (view as MarkdownView).editor;
  }
}


/*
Notes:
- This code targets the common Obsidian editor API provided by the MarkdownView.editor object.
- The Editor methods used here follow CodeMirror-style APIs available in Obsidian plugin examples: getCursor, getSelection, setSelection, getLine, lineCount, setCursor.
- If the editor in your Obsidian build exposes slightly different method signatures, adapt the calls accordingly.
- To make a complete plugin package you must add:
  - manifest.json (with id, name, version, main)
  - package.json and a build step to compile TypeScript to JS

*/
