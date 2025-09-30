import { Editor, EditorPosition } from "obsidian";

type Range = {
    start: number
    end: number
};

type State = {
    selection: string
    from: number
    to: number
    anchor: number
    lineRange: Range
    paragraphRange: Range
    documentRange: Range
}

export default class SelectionExpanderPluginImpl {

    /* TODO
        - Include Offset or Pos in variable names to make intent clear
    */

    private editor: Editor;
    private cursor: number;

    setEditor(editor: Editor) {
        this.editor = editor;
    }

    private invalidateEditor() {
        this.editor = null;
    }

    private checkEditor() {
        if (!this.editor)
            throw new ReferenceError("editor not set");
    }

    getCursor(): EditorPosition {
        this.checkEditor();
        const offset = this.getAndOptionallySetGlobalAnchor()
        return this.editor.offsetToPos(offset);
    }

    expandSelectionCycle() {
        this.checkEditor();
        const $ = this; // scope variable for nested functions
        const state = this.getState();

        log();

        if (nothingIsSelected()) {
            selectLine();
            if (nothingIsSelected()) { // Blank line
                selectParagraph();
                if (nothingIsSelected()) { // Blank line surrounded by blank lines
                    selectDocument();
                }
            }
        } else { // Something is selected
            if (selectionIsOnSingleLine()) {
                const sel = {start: state.from, end: state.to};
                const range = $.getParagraphRange(state.from);
                if (lineIsPartiallySelected(sel, range)) {
                    selectLine();
                } else {
                    selectParagraph();
                }
            } else { // Selection spans multiple lines
                const sel = {start: state.from, end: state.to};
                const range1 = $.getParagraphRange(state.from);
                const range2 = $.getParagraphRange(state.to);
                if (eitherParagraphsArePartiallySelected(sel, range1, range2)) {
                    const newRange: Range = {start: range1.start, end: range2.end};
                    $.setSelection(newRange);
                } else {
                    selectDocument();
                }
            }
        }

        this.invalidateEditor();


        function nothingIsSelected() {
            console.log("TRACE: nothingSelected() ?");
            return $.isNothingSelected();
        }

        function selectionIsOnSingleLine() {
            console.log("TRACE: selectionIsOnSingleLine() ?");
            const from = this.editor.offsetToPos(state.from);
            const to = this.editor.offsetToPos(state.to);
            return from.line === to.line;
        }

        function lineIsPartiallySelected(sel: Range, range: Range) {
            console.log("TRACE: lineIsPartiallySelected() ?");
            return sel.start > range.start || sel.end < range.end;
        }

        function eitherParagraphsArePartiallySelected(sel: Range, range1: Range, range2: Range) {
            console.log("TRACE: eitherParagraphsArePartiallySelected() ?");
            return sel.start > range1.start || sel.end < range2.end;
        }

        function selectLine() {
            console.log("TRACE: selectLine()");
            $.setSelection(state.lineRange);
        }

        function selectParagraph() {
            console.log("TRACE: selectParagraph()");
            $.setSelection(state.paragraphRange);
        }

        function selectDocument() {
            console.log("TRACE: selectDocument()");
            $.setSelection(state.documentRange);
        }

        function log() {
            console.log($.getCursor())
            console.log(state);
        }
    }

    shrinkSelectionCycle() {
        this.checkEditor();
        const $ = this; // scope variable for nested functions
        const state = this.getState();

        if (nothingSelected()) {
            return;
        } else if (lineSelected()) {
            restoreAnchor();
        } else if (paragraphSelected()) {
            selectLine();
        } else if (documentSelected()) {
            selectParagraph();
        }

        this.invalidateEditor();

        function nothingSelected() {
            return $.isNothingSelected();
        }

        function lineSelected() {
            return $.isFullRangeSelected(state.lineRange);
        }

        function paragraphSelected() {
            return $.isFullRangeSelected(state.paragraphRange);
        }

        function documentSelected() {
            return $.isFullRangeSelected(state.documentRange);
        }

        function restoreAnchor() {
            console.log("<< A");
            $.setCursor($.cursor);
            $.cursor = null;
        }

        function selectLine() {
            console.log("<< L");
            $.setSelection(state.lineRange);
        }

        function selectParagraph() {
            console.log("<< P");
            $.setSelection(state.paragraphRange);
        }
    }

    private getState(): State {
        const anchor = this.getAndOptionallySetGlobalAnchor();
        return {
            selection: this.editor.getSelection(),
            from: this.editor.posToOffset(this.editor.getCursor("from")),
            to: this.editor.posToOffset(this.editor.getCursor("to")),
            anchor: anchor,
            lineRange: this.getLineRange(anchor),
            paragraphRange: this.getParagraphRange(anchor),
            documentRange: this.getDocRange(),
        }
    }
    
    private getAndOptionallySetGlobalAnchor(): number {
        const from = this.editor.posToOffset(this.editor.getCursor("from"));
        const to = this.editor.posToOffset(this.editor.getCursor("to"));
        const selectionContainsAnchor = (this.cursor >= from && this.cursor <= to);
        console.log("selectionContainsAnchor: ", selectionContainsAnchor);
        if (!this.cursor || this.isNothingSelected() || !selectionContainsAnchor) {
            console.log("(re)setting anchor to: ", from);
            this.cursor = from;
        }
        return this.cursor;
    }

    private isNothingSelected(): boolean {
        return this.editor.getSelection().length === 0;
    }

    private isSelectionWithinRange(range: Range): boolean {
        if (this.isNothingSelected())
            return false; // Satisfy that range is greater than 0
        const from = this.editor.posToOffset(this.editor.getCursor("from"));
        const to = this.editor.posToOffset(this.editor.getCursor("to"));
        return (from >= range.start) && (to <= range.end);
    }

    private isFullRangeSelected(range: Range): boolean {
        if (this.isNothingSelected())
            return false; // Satisfy that range is greater than 0
        const from = this.editor.posToOffset(this.editor.getCursor("from"));
        const to = this.editor.posToOffset(this.editor.getCursor("to"));
        return (from === range.start) && (to === range.end);
    }

    private setSelection(range: Range) {
        this.editor.setSelection(this.editor.offsetToPos(range.start), this.editor.offsetToPos(range.end));
    }

    private setCursor(pos: number) {
        this.editor.setCursor(this.editor.offsetToPos(pos));
    }

    private getLineRange(offset: number): Range {
        const pos = this.editor.offsetToPos(offset);
        const text = this.editor.getLine(pos.line);
        const start = this.editor.posToOffset({ line: pos.line, ch: 0 });
        const end = this.editor.posToOffset({ line: pos.line, ch: text.length });
        return { start, end };
    }

    private getParagraphRange(offset: number): Range {
        const pos = this.editor.offsetToPos(offset);
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
        const start = this.editor.posToOffset({ line: startLine, ch: 0 });
        const end = this.editor.posToOffset({ line: endLine, ch: this.editor.getLine(endLine).length });
        return { start, end };
    }

    private getDocRange(): Range {
        const lastLine = this.editor.lineCount() - 1;
        return {
            start: 0,
            end: this.editor.posToOffset({ line: lastLine, ch: this.editor.getLine(lastLine).length })
        };
    }
}
