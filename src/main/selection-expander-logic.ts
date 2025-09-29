import { EditorPosition } from "obsidian";

export interface EditorInterface {
    getSelection(): string;
    getCursor(which?: 'from' | 'to'): EditorPosition;
    setCursor(pos: EditorPosition): void;
    setSelection(from: EditorPosition, to: EditorPosition): void;
    getLine(line: number): string;
    lineCount(): number;
    posToOffset(pos: EditorPosition): number;
    offsetToPos(offset: number): EditorPosition;
}

type Range = {
    start: number;
    end: number;
};

type State = {
    selection: string,
    from: number,
    to: number,
    anchor: number,
    lineRange: Range,
    paragraphRange: Range,
    documentRange: Range,
}

// Using CodeMirror-style API

// A line consists of multiple sentences followed by a newline character.
// A paragraph consists of one or more lines. A paragraph is surrounded by a blank line or a header.
  
export default class SelectionExpanderLogic {

    private anchor: number;

    expandSelectionCycle(editor: EditorInterface) {
        const $ = this; // scope variable for nested functions
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

    shrinkSelectionCycle(editor: EditorInterface) {
        const $ = this; // scope variable for nested functions
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

    getState(editor: EditorInterface): State {
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

    getAndOptionallySetGlobalAnchor(editor: EditorInterface): number {
        if (!this.anchor || this.isNothingSelected(editor)) {
            this.anchor = editor.posToOffset(editor.getCursor());
        }
        return this.anchor;
    }

    isNothingSelected(editor: EditorInterface): boolean {
        return editor.getSelection().length === 0;
    }

    isSelectionWithinRange(editor: EditorInterface, range: Range): boolean {
        if (this.isNothingSelected(editor))
            return false; // Satisfy that range is greater than 0
        const from = editor.posToOffset(editor.getCursor("from"));
        const to = editor.posToOffset(editor.getCursor("to"));
        return (from >= range.start) && (to <= range.end);
    }

    isRangeSelected(editor: EditorInterface, range: Range): boolean {
        if (this.isNothingSelected(editor))
            return false; // Satisfy that range is greater than 0
        const from = editor.posToOffset(editor.getCursor("from"));
        const to = editor.posToOffset(editor.getCursor("to"));
        return (from === range.start) && (to === range.end);
    }

    setSelection(editor: EditorInterface, range: Range) {
        editor.setSelection(editor.offsetToPos(range.start), editor.offsetToPos(range.end));
    }

    setCursor(editor: EditorInterface, pos: number) {
        editor.setCursor(editor.offsetToPos(pos));
    }

    getLineRange(editor: EditorInterface, offset: number): Range {
        const pos = editor.offsetToPos(offset);
        const text = editor.getLine(pos.line);
        const start = editor.posToOffset({ line: pos.line, ch: 0 });
        const end = editor.posToOffset({ line: pos.line, ch: text.length });
        return { start, end };
    }

    getParagraphRange(editor: EditorInterface, offset: number): Range {
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

    getDocRange(editor: EditorInterface): Range {
        const lastLine = editor.lineCount() - 1;
        return {
            start: 0,
            end: editor.posToOffset({ line: lastLine, ch: editor.getLine(lastLine).length })
        };
    }
}
