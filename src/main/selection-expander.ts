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

type EditorPositionRange = {
  start: { line: number; ch: number };
  end: { line: number; ch: number };
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

  private editor: Editor | null;
  private selection: string | null;
  private anchorPos: EditorPosition | null;
  private fromPos: EditorPosition | null;
  private toPos: EditorPosition | null;
  private lineRange: EditorPositionRange | null;
  private paragraphRange: EditorPositionRange | null;
  private docRange: EditorPositionRange | null;

  // Using CodeMirror-style API

  private expandSelectionCycle() {
    if (!this.initSelectionState())
      return;

    if (this.isCaret()) {
      this.expandToLine();

    } else if (this.isLineSelected(this.fromPos, this.toPos, this.lineRange) && !this.isParapraphSelected(this.fromPos, this.toPos, this.paragraphRange)) {
      this.expandToParagraph();

    } else if (this.isParapraphSelected(this.fromPos, this.toPos, this.paragraphRange)) {
      this.expandToDocument();
    }
  }

  private shrinkSelectionCycle() {
    if (!this.initSelectionState())
      return;
    if (!this.anchorPos)
      return;

    // const from = editor.getCursor('from');
    // const to = editor.getCursor('to');
    // const lineRange = this.getLineRange(this.anchorPos);
    // const paragraphRange = this.getParagraphRange(this.anchorPos);
    // const docRange = this.getDocRange();

    if (this.isDocumentSelected(this.fromPos, this.toPos, this.docRange)) {
      this.shrinkToParagraph(this.paragraphRange);
      
    } else if (this.isParapraphSelected(this.fromPos, this.toPos, this.paragraphRange) && !this.isLineSelected(this.fromPos, this.toPos, this.lineRange)) {
      this.shrinkToLine(this.lineRange);
      
    } else if (this.isLineSelected(this.fromPos, this.toPos, this.lineRange)) {
        this.shrinkToCaret(this.anchorPos);
        this.anchorPos = null;
    }
  }
 
  private initSelectionState(): boolean {
    this.editor = this.getActiveEditor();    
    if(!this.editor) 
      return false;

    this.selection = this.editor.getSelection();
    this.fromPos = this.editor.getCursor('from');
    this.toPos = this.editor.getCursor('to');
    
    console.log("sel", JSON.stringify(this.selection));
    console.log("from", JSON.stringify(this.fromPos));
    console.log("to", JSON.stringify(this.toPos));

    // States: caret, line, paragraph, document

    if (this.isCaret()) {
      this.anchorPos = this.fromPos;
    }
    this.lineRange = this.getLineRange(this.anchorPos);
    this.paragraphRange = this.getParagraphRange(this.anchorPos);
    this.docRange = this.getDocRange();

    console.log("anchorPos", JSON.stringify(this.anchorPos));
    console.log("isCaret: ", JSON.stringify(this.isCaret()));
    console.log("lineRange: ", JSON.stringify(this.lineRange));
    console.log("paragraphRange: ", JSON.stringify(this.paragraphRange));
    console.log("docRange: ", JSON.stringify(this.docRange));

    return true;
  }
  
  private expandToDocument() {
    console.log(">> Current selection: paragraph >> Expand selection to document");
    this.setSelection(this.docRange.start, this.docRange.end);
  }

  private expandToParagraph() {
    console.log(">> Current selection: line >> Expand selection to paragraph");
    this.setSelection(this.paragraphRange.start, this.paragraphRange.end);
  }

  private expandToLine() {
    console.log(">> Current selection: none >> Expand selection to line");
    this.editor.setSelection(this.lineRange.start, this.lineRange.end);
  }

  private isCaret() {
    return this.selection.length === 0;
  }

  
  private getActiveEditor(): Editor | null {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) return null;
    return (view as MarkdownView).editor;
  }

  private setSelection(start: EditorPosition, end: EditorPosition) {
    this.editor.setSelection(start, end);
    console.log("---");
  }

  private posIsEqual(a: EditorPosition, b: EditorPosition) {
    return a.line === b.line && a.ch === b.ch;
  }

  private isLineSelected(from: EditorPosition, to: EditorPosition, lineRange: EditorPositionRange) {
    return this.rangeEquals(from, to, lineRange.start, lineRange.end);
  }
  
  private isParapraphSelected(from: EditorPosition, to: EditorPosition, paragraphRange: EditorPositionRange) {
    return this.rangeEquals(from, to, paragraphRange.start, paragraphRange.end);
  }

  private isDocumentSelected(from: EditorPosition, to: EditorPosition, docRange: EditorPositionRange) {
    return this.rangeEquals(from, to, docRange.start, docRange.end);
  }
  
  private rangeEquals(aFrom: EditorPosition, aTo: EditorPosition, bFrom: EditorPosition, bTo: EditorPosition) {
    return this.posIsEqual(aFrom, bFrom) && this.posIsEqual(aTo, bTo);
  }

  private shrinkToParagraph(paragraphRange: EditorPositionRange) {
    this.editor.setSelection(paragraphRange.start, paragraphRange.end);
  }
  
  private shrinkToLine(lineRange: EditorPositionRange) {
    this.editor.setSelection(lineRange.start, lineRange.end);
  }

  private shrinkToCaret(pos: EditorPosition) {
    this.editor.setCursor(pos);
  }

  private getLineRange(pos: EditorPosition) : EditorPositionRange {
    const lineText = this.editor.getLine(pos.line);
    return {
      start: { line: pos.line, ch: 0 },
      end: { line: pos.line, ch: lineText.length }
    };
  }

  private getParagraphRange(pos: EditorPosition) : EditorPositionRange {
    const maxLine = this.editor.lineCount() - 1;
    // find start
    let startLine = pos.line;
    while (startLine > 0) {
      const text = this.editor.getLine(startLine - 1);
      if (text.trim() === '') break;
      startLine--;
    }
    // find end
    let endLine = pos.line;
    while (endLine < maxLine) {
      const text = this.editor.getLine(endLine + 1);
      if (text.trim() === '') break;
      endLine++;
    }
    const start = { line: startLine, ch: 0 };
    const end = { line: endLine, ch: this.editor.getLine(endLine).length };
    return { start, end };
  }
  
  private getDocRange() : EditorPositionRange {
    return { 
      start: { line: 0, ch: 0 }, 
      end: { line: this.editor.lineCount() - 1, ch: this.editor.getLine(this.editor.lineCount() - 1).length } 
    };
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
