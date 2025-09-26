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
  

  // Using CodeMirror-style API
  
  // A line consists of multiple sentences followed by a newline character.
  // A paragraph consists of one or more lines. A paragraph is surrounded by a blank line or a header.
  
  private anchor: number | null;

  private expandSelectionCycle() {
    const $ = this; // scope variable for nested functions
    const editor = this.getActiveEditor();
    if (!editor) return;
    
    const state = this.getState(editor);

    log();

    
    if (nothingSelected()) {
      selectLine();
      if (nothingSelected()) { // Blank line
        selectParagraph();
        if (nothingSelected()) { // Multiple blank lines
          selectDocument();
        }
      }
    } else if (partialLineSelected()) {
      selectLine();
      
    } else if (entireLineSelected()) {
      selectParagraph();
      if (nothingSelected()) { // Multiple blank lines
        selectDocument();
      }
    } else if (partialParapraphSelected()) {
      selectParagraph();

    } else if (entireParagraphSelected()) {
      selectDocument();
    }
    

    function nothingSelected() {
      return $.isNothingSelected(editor);
    }
    
    function partialLineSelected() {
      // The entire line selected does not qualify as partial
      return $.isSelectionWithinRange(editor, state.lineRange) && !$.isRangeSelected(editor, state.lineRange);
    }

    function entireLineSelected() {
      // If line is also a paragraph, let paragraph handle it
      return $.isRangeSelected(editor, state.lineRange) && !$.isRangeSelected(editor, state.paragraphRange);
    }

    function partialParapraphSelected() {
      // The entire paragraph selected does not qualify as partial
      return $.isSelectionWithinRange(editor, state.paragraphRange) && !$.isRangeSelected(editor, state.paragraphRange);
    }
    
    function entireParagraphSelected() {
      return $.isRangeSelected(editor, state.paragraphRange);
    }

    function selectLine() {
      console.log(">> L");
      $.setSelection(editor, state.lineRange);
    }

    function selectParagraph() {
      console.log(">> P");
      $.setSelection(editor, state.paragraphRange);
    }

    function selectDocument() {
      console.log(">> D");
      $.setSelection(editor, state.documentRange);
    }

    function log() {
      console.log("selected (n,l,p) = (%s,%s,%s)", nothingSelected(), entireLineSelected(), entireParagraphSelected());
      console.log(state);
    }
  }



  private shrinkSelectionCycle() {
    const $ = this; // scope variable for nested functions
    const editor = this.getActiveEditor();
    if (!editor) return;
    
    const state = this.getState(editor);


    if (nothingSelected()) {
      return;
    } else if (lineSelected()) {
      restoreAnchor();
    } else if (paragraphSelected()) {
      selectLine();
    } else if (documentSelected()) {
      selectParagraph();
    }


    function nothingSelected() {
      return $.isNothingSelected(editor);
    }

    function lineSelected() {
      return $.isRangeSelected(editor, state.lineRange);
    }

    function paragraphSelected() {
      return $.isRangeSelected(editor, state.paragraphRange);
    }

    function documentSelected() {
      return $.isRangeSelected(editor, state.documentRange);
    }

    function restoreAnchor() {
      console.log("<< A");
      $.setCursor(editor, $.anchor);
      $.anchor = null;
    }

    function selectLine() {
      console.log("<< L");
      $.setSelection(editor, state.lineRange);
    }

    function selectParagraph() {
      console.log("<< P");
      $.setSelection(editor, state.paragraphRange);
    }
  }

  





  private getActiveEditor(): Editor | null {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) return null;
    return (view as MarkdownView).editor;
  }
  
  private getState(editor: Editor): SelectionState {
    const anchor = this.getAndOptionallySetGlobalAnchor(editor);
    return {
      selection: editor.getSelection(),
      from: editor.posToOffset(editor.getCursor("from")),
      to: editor.posToOffset(editor.getCursor("to")),
      anchor: anchor,
      lineRange: this.getLineRange(editor, anchor),
      paragraphRange: this.getParagraphRange(editor, anchor),
      documentRange: this.getDocRange(editor),
    }
  }

  private getAndOptionallySetGlobalAnchor(editor: Editor): number {
    if (!this.anchor || this.isNothingSelected(editor)) {
      this.anchor = editor.posToOffset(editor.getCursor());
    }
    return this.anchor;
  }

  private isNothingSelected(editor: Editor): boolean {
    return editor.getSelection().length === 0;
  } 

  private isSelectionWithinRange(editor: Editor, range: SelectionRange): boolean {
    if (this.isNothingSelected(editor))
      return false; // Satisfy that range is greater than 0
    const from = editor.posToOffset(editor.getCursor("from"));
    const to = editor.posToOffset(editor.getCursor("to"));
    return (from >= range.start) && (to <= range.end);
  }
  
  private isRangeSelected(editor: Editor, range: SelectionRange): boolean {
    if (this.isNothingSelected(editor))
      return false; // Satisfy that range is greater than 0
    const from = editor.posToOffset(editor.getCursor("from"));
    const to = editor.posToOffset(editor.getCursor("to"));
    return (from === range.start) && (to === range.end);
  }
  
  private setSelection(editor: Editor, range: SelectionRange) {
    editor.setSelection(editor.offsetToPos(range.start), editor.offsetToPos(range.end));
  }

  private setCursor(editor: Editor, pos: number) {
    editor.setCursor(editor.offsetToPos(pos));
  }





  private getLineRange(editor: Editor, offset: number) : SelectionRange {
    const pos = editor.offsetToPos(offset);
    const text = editor.getLine(pos.line);
    const start = editor.posToOffset({ line: pos.line, ch: 0 });
    const end = editor.posToOffset({ line: pos.line, ch: text.length });
    return { start, end };
  }

  private getParagraphRange(editor: Editor, offset: number) : SelectionRange {
    const pos = editor.offsetToPos(offset);
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
    const start = editor.posToOffset({ line: startLine, ch: 0 });
    const end = editor.posToOffset({ line: endLine, ch: editor.getLine(endLine).length });
    return { start, end };
  }
  
  private getDocRange(editor: Editor) : SelectionRange {
    const lastLine = editor.lineCount() - 1;
    return { 
      start: 0,
      end: editor.posToOffset({ line: lastLine, ch: editor.getLine(lastLine).length })
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
