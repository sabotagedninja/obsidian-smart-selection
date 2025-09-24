// Obsidian Selection Expander
// Single-file draft plugin.
// Install: put compiled JS and manifest into a plugin folder per Obsidian docs.

import { App, Editor, MarkdownView, EditorPosition, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface SelectionExpanderPluginSettings {
  mySetting: string;
}

const DEFAULT_SETTINGS: SelectionExpanderPluginSettings = {
  mySetting: 'default'
}

export default class SelectionExpanderPlugin extends Plugin {
  settings: SelectionExpanderPluginSettings;

  private anchorPos: EditorPosition | null = null;

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

  private getActiveEditor(): Editor | null {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) return null;
    return (view as MarkdownView).editor;
  }

  private setSelection(editor: Editor, start: EditorPosition, end: EditorPosition) {
    editor.setSelection(start, end);
    console.log("---");
  }

  private posIsEqual(a: EditorPosition, b: EditorPosition) {
    return a.line === b.line && a.ch === b.ch;
  }

  // CodeMirror-style API
  private expandSelectionCycle() {
    const editor = this.getActiveEditor();
    if (!editor) return;

    const sel = editor.getSelection();
    const from = editor.getCursor('from');
    const to = editor.getCursor('to');

    console.log("sel", JSON.stringify(sel));
    console.log("from", JSON.stringify(from));
    console.log("to", JSON.stringify(to));

    // States: caret, line, paragraph, document
    // Determine current state
    const isCaret = sel.length === 0;
    const lineRange = this.getLineRange(editor, from);
    const paragraphRange = this.getParagraphRange(editor, from);
    const docRange = this.getDocRange(editor);

    if (isCaret) {
      this.anchorPos = from;
    }
    console.log("isCaret: ", JSON.stringify(isCaret));
    console.log("lineRange: ", JSON.stringify(lineRange));
    console.log("paragraphRange: ", JSON.stringify(paragraphRange));
    console.log("docRange: ", JSON.stringify(docRange));

    // If caret, expand to line
    if (isCaret) {
      console.log(">> Current selection: none >> Expand selection to line");
      this.setSelection(editor, lineRange.start, lineRange.end);
      return;
    }

    // If selection equals line, expand to paragraph
    if (this.rangeEquals(from, to, lineRange.start, lineRange.end) && !this.rangeEquals(from, to, paragraphRange.start, paragraphRange.end)) {
      console.log(">> Current selection: line >> Expand selection to paragraph");
      this.setSelection(editor, paragraphRange.start, paragraphRange.end);
      return;
    }

    // If selection equals paragraph, expand to document
    if (this.rangeEquals(from, to, paragraphRange.start, paragraphRange.end)) {
      console.log(">> Current selection: paragraph >> Expand selection to document");
      this.setSelection(editor, docRange.start, docRange.end);
      return;
    }
  }

  private shrinkSelectionCycle() {
    const editor = this.getActiveEditor();
    if (!editor) return;

    if (!this.anchorPos) return;

    const from = editor.getCursor('from');
    const to = editor.getCursor('to');
    const lineRange = this.getLineRange(editor, this.anchorPos);
    const paragraphRange = this.getParagraphRange(editor, this.anchorPos);
    const docRange = this.getDocRange(editor);

    // If whole document selected, shrink to paragraph
    if (this.rangeEquals(from, to, docRange.start, docRange.end)) {
      this.setSelection(editor, paragraphRange.start, paragraphRange.end);
      return;
    }

    // If paragraph selected, shrink to line
    if (this.rangeEquals(from, to, paragraphRange.start, paragraphRange.end) && !this.rangeEquals(from, to, lineRange.start, lineRange.end)) {
      this.setSelection(editor, lineRange.start, lineRange.end);
      return;
    }

    // If line selected, shrink to caret at original position
    if (this.rangeEquals(from, to, lineRange.start, lineRange.end)) {
      if (this.anchorPos) {
        editor.setCursor(this.anchorPos);
        this.anchorPos = null; // reset anchor after returning to caret
      } else {
        editor.setCursor(lineRange.start);
      }
      return;
    }
  }

  private getLineRange(editor: Editor, pos: EditorPosition) {
    const lineText = editor.getLine(pos.line);
    return {
      start: { line: pos.line, ch: 0 },
      end: { line: pos.line, ch: lineText.length }
    };
  }

  private getParagraphRange(editor: Editor, pos: EditorPosition) {
    const maxLine = editor.lineCount() - 1;
    // find start
    let startLine = pos.line;
    while (startLine > 0) {
      const text = editor.getLine(startLine - 1);
      if (text.trim() === '') break;
      startLine--;
    }
    // find end
    let endLine = pos.line;
    while (endLine < maxLine) {
      const text = editor.getLine(endLine + 1);
      if (text.trim() === '') break;
      endLine++;
    }
    const start = { line: startLine, ch: 0 };
    const end = { line: endLine, ch: editor.getLine(endLine).length };
    return { start, end };
  }
  
  private getDocRange(editor: Editor) {
    return { start: { line: 0, ch: 0 }, end: { line: editor.lineCount() - 1, ch: editor.getLine(editor.lineCount() - 1).length } };
  }

  private rangeEquals(aFrom: EditorPosition, aTo: EditorPosition, bFrom: EditorPosition, bTo: EditorPosition) {
    return this.posIsEqual(aFrom, bFrom) && this.posIsEqual(aTo, bTo);
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

manifest.json example:
{
  "id": "obsidian-selection-expander",
  "name": "Selection Expander",
  "version": "0.1.0",
  "minAppVersion": "0.12.0",
  "description": "Cycle selection from caret to line, paragraph, and document with repeated Ctrl+A.",
  "author": "(your name)",
  "main": "main.js"
}
*/
