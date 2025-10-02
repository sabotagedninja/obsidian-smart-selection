import { Editor, EditorPosition, EditorRange, EditorSelection } from 'obsidian';

export default class SelectionExpanderPluginImpl {
    private editor: Editor;
    private cursor: EditorPosition;

    setEditor(editor: Editor): void {
        this.editor = editor;
    }
    getEditor(): Editor {
        return this.editor;
    }
    private checkEditor() {
        if (!this.editor)
            throw new ReferenceError('editor not set');
    }

    expandSelection(): void {
        this.checkEditor();
        const $ = this; // scope variable for nested functions
        const editor = this.editor;
        const cursor = this.initCursor();
        const from = this.editor.getCursor('from');
        const to = this.editor.getCursor('to');
        const selectionRange = toRange(from, to);
        const lineRange = this.getLineRange(cursor);
        const paragraphRange = this.getParagraphRange(cursor);
        const documentRange = this.getDocumentRange();

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
                if (lineIsPartiallySelected(selectionRange, lineRange)) {
                // if (eitherParagraphsArePartiallySelected(selectionRange, lineRange, lineRange)) {
                    selectLine();
                } else {
                    selectParagraph();
                }
            } else { // Selection spans multiple lines
                // Selection could be contained inside one paragraph, or it could span multiple paragraphs (calculation is the same)
                // If one paragraph is partially selected, then range2 is the same as range1
                const range1 = this.getParagraphRange(from);
                const range2 = this.getParagraphRange(to);
                if (eitherParagraphsArePartiallySelected(selectionRange, range1, range2)) {
                    $.setSelection(toSelection(range1.from, range2.to));
                } else {
                    selectDocument();
                }
            }
        }

        // TODO Move these methods down to class level

        function nothingIsSelected() {
            console.log('TRACE: nothingSelected() ?');
            return $.isNothingSelected();
        }

        function selectionIsOnSingleLine() {
            console.log('TRACE: selectionIsOnSingleLine() ?');
            return from.line === to.line;
        }

        function lineIsPartiallySelected(selection: EditorRange, line: EditorRange) {
            console.log('TRACE: lineIsPartiallySelected() ?');
            // Check if selection is contained within the bounds of the line (but not equal to)
            return rangeContains(selection, line) && !rangeEquals(selection, line);
        }

        function eitherParagraphsArePartiallySelected(selection: EditorRange, par1: EditorRange, par2: EditorRange) {
            console.log('TRACE: eitherParagraphsArePartiallySelected() ?');
            // Both paragraphs are fully selected if:
            //   - the start of the selection is equal to the start of paragraph 1.
            //   - the end of the selection is equal to the end of paragraph 2.
            //   - i.e. selection is equal to the union of both paragraphs
            // Either paragraphs are only partially selected when this is not the case (only one needs to be true).
            return !posEquals(selection.from, par1.from) || !posEquals(selection.to, par2.to);
        }

        function selectLine() {
            console.log('TRACE: selectLine()');
            $.setSelection(toSelection(lineRange.from, lineRange.to));
        }

        function selectParagraph() {
            console.log('TRACE: selectParagraph()');
            $.setSelection(toSelection(paragraphRange.from, paragraphRange.to));
        }

        function selectDocument() {
            console.log('TRACE: selectDocument()');
            $.setSelection(toSelection(documentRange.from, documentRange.to));
        }
    }

    shrinkSelection(): void {
        this.checkEditor();
        const $ = this; // scope variable for nested functions
        const editor = this.editor;
        const cursor = this.initCursor();
        const from = this.editor.getCursor('from');
        const to = this.editor.getCursor('to');
        const selectionRange = toRange(from, to);
        const lineRange = this.getLineRange(cursor);
        const paragraphRange = this.getParagraphRange(cursor);
        const documentRange = this.getDocumentRange();

        if (nothingSelected()) {
            return;
        } else if (lineSelected()) {
            restoreCursor();
        } else if (paragraphSelected()) {
            selectLine();
        } else if (documentSelected()) {
            selectParagraph();
        }

        function nothingSelected() {
            return $.isNothingSelected();
        }

        function lineSelected() {
            return rangeEquals(selectionRange, lineRange);
        }

        function paragraphSelected() {
            return rangeEquals(selectionRange, paragraphRange);
        }

        function documentSelected() {
            return rangeEquals(selectionRange, documentRange);
        }

        function restoreCursor() {
            console.log('TRACE: restoreCursor()');
            $.setCursor(cursor);
            $.cursor = null;
        }

        function selectLine() {
            console.log('TRACE: selectLine()');
            $.setSelection(toSelection(lineRange.from, lineRange.to));
        }

        function selectParagraph() {
            console.log('TRACE: selectParagraph()');
            $.setSelection(toSelection(paragraphRange.from, paragraphRange.to));
        }
    }

    private initCursor(): EditorPosition {
        const anchor = this.editor.getCursor('anchor');

        // If cursor is not set or nothing is selected
        if (!this.cursor || this.isNothingSelected()) {
            console.log('(re)setting cursor to: ', JSON.stringify(anchor));
            return this.cursor = anchor;
        }

        const anchorIndex = this.editor.posToOffset(anchor);
        const cursorIndex = this.editor.posToOffset(this.cursor);
        const cursorAndAnchorAreEqual = (anchorIndex === cursorIndex); // USING INDEXES HERE

        // If the anchor of the selection is different than the stored cursor
        if (!cursorAndAnchorAreEqual) {
            console.log('(re)setting cursor to: ', JSON.stringify(anchor));
            return this.cursor = anchor
        }

        return this.cursor;
    }

    private isNothingSelected(): boolean {
        return !this.editor.somethingSelected();
    }

    private setSelection(selection: EditorSelection) {
        this.editor.setSelection(selection.anchor, selection.head);
    }

    private setCursor(pos: EditorPosition): void {
        this.editor.setCursor(pos);
    }

    private getLineRange(pos: EditorPosition): EditorRange {
        const text = this.editor.getLine(pos.line);
        return toRange(toPos(pos.line, 0), toPos(pos.line, text.length));
    }

    private getParagraphRange(pos: EditorPosition): EditorRange {
        const lastLine = this.editor.lastLine();
        // find start
        let startLine = pos.line;
        while (startLine > 0) {
            const text = this.editor.getLine(startLine - 1);
            if (text.trim() === '') break;
            startLine--;
        }
        // find end
        let endLine = pos.line;
        while (endLine < lastLine) {
            const text = this.editor.getLine(endLine + 1);
            if (text.trim() === '') break;
            endLine++;
        }
        const text = this.editor.getLine(endLine);
        return toRange(toPos(startLine, 0), toPos(endLine, text.length));
    }

    private getDocumentRange(): EditorRange {
        const lastLine = this.editor.lastLine();
        const text = this.editor.getLine(lastLine);
        return toRange(toPos(0, 0), toPos(lastLine, text.length));
    }

}

/* === HELPER FUNCTIONS === */

function toPos(line: number, ch: number): EditorPosition {
    return { line: line, ch: ch };
}
function toRange(from: EditorPosition, to: EditorPosition): EditorRange {
    return { from: from, to: to };
}
function toSelection(anchor: EditorPosition, head: EditorPosition): EditorSelection;
function toSelection(range: EditorRange): EditorSelection;
function toSelection(a: EditorPosition | EditorRange, b?: EditorPosition): EditorSelection {
    if ("from" in a && "to" in a) {
        return { anchor: a.from, head: a.to };
    } else {
        if (!b) throw new Error("Head position missing");
        return { anchor: a, head: b };
    }
}
function posEquals(p1: EditorPosition, p2: EditorPosition): boolean {
    return p1.line == p2.line && p1.ch == p2.ch;
}
function posGTE(p1: EditorPosition, p2: EditorPosition): boolean {
    if (p1.line < p2.line) return false;
    if (p1.line > p2.line) return true;
    return p1.ch >= p2.ch;
}
function posGT(p1: EditorPosition, p2: EditorPosition): boolean {
    if (p1.line < p2.line) return false;
    if (p1.line > p2.line) return true;
    return p1.ch > p2.ch;
}
function posLTE(p1: EditorPosition, p2: EditorPosition): boolean {
    if (p1.line < p2.line) return true;
    if (p1.line > p2.line) return false;
    return p1.ch <= p2.ch;
}
function posLT(p1: EditorPosition, p2: EditorPosition): boolean {
    if (p1.line < p2.line) return true;
    if (p1.line > p2.line) return false;
    return p1.ch < p2.ch;
}
function rangeEquals(r1: EditorRange, r2: EditorRange): boolean {
    return posEquals(r1.from, r2.from) && posEquals(r1.to, r2.to);
}
function rangeContains(r1: EditorRange, r2: EditorRange): boolean {
    return posGTE(r1.from, r2.from) && posLTE(r1.to, r2.to);
}
function rangeOverlaps(r1: EditorRange, r2: EditorRange): boolean {
    return posLTE(r1.from, r2.to) && posGTE(r1.to, r2.from);
}