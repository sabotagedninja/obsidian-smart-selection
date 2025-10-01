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
                    selectLine();
                } else {
                    selectParagraph();
                }
            } else { // Selection spans multiple lines
                const range1 = this.getParagraphRange(from);
                const range2 = this.getParagraphRange(to);
                if (eitherParagraphsArePartiallySelected(selectionRange, range1, range2)) {
                    $.setSelection(toSelection(range1.from, range2.to));
                } else {
                    selectDocument();
                }
            }
        }

        function nothingIsSelected() {
            console.log('TRACE: nothingSelected() ?');
            return $.isNothingSelected();
        }

        function selectionIsOnSingleLine() {
            console.log('TRACE: selectionIsOnSingleLine() ?');
            return from.line === to.line;
        }

        // FIXME These two methods are almost identical
        function lineIsPartiallySelected(selection: EditorRange, range: EditorRange) {
            console.log('TRACE: lineIsPartiallySelected() ?');
            const fromIndex = editor.posToOffset(selection.from);
            const toIndex = editor.posToOffset(selection.to);
            const startIndex = editor.posToOffset(range.from);
            const endIndex = editor.posToOffset(range.to);
            return fromIndex > startIndex || toIndex < endIndex; // USING INDEXES HERE
        }

        function eitherParagraphsArePartiallySelected(selection: EditorRange, range1: EditorRange, range2: EditorRange) {
            console.log('TRACE: eitherParagraphsArePartiallySelected() ?');
            const fromIndex = editor.posToOffset(selection.from);
            const toIndex = editor.posToOffset(selection.to);
            const startIndex = editor.posToOffset(range1.from);
            const endIndex = editor.posToOffset(range2.to);
            return fromIndex > startIndex || toIndex < endIndex; // USING INDEXES HERE
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
            return $.isFullRangeSelected(lineRange);
        }

        function paragraphSelected() {
            return $.isFullRangeSelected(paragraphRange);
        }

        function documentSelected() {
            return $.isFullRangeSelected(documentRange);
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

        if (!this.cursor || this.isNothingSelected()) {
            console.log('(re)setting cursor to: ', JSON.stringify(anchor));
            return this.cursor = anchor;
        }
        
        const anchorIndex = this.editor.posToOffset(anchor);
        const cursorIndex = this.editor.posToOffset(this.cursor);
        const cursorAndAnchorAreEqual = (anchorIndex === cursorIndex); // USING INDEXES HERE

        if (!cursorAndAnchorAreEqual) {
            console.log('(re)setting cursor to: ', JSON.stringify(anchor));
            return this.cursor = anchor
        }
        
        return this.cursor;
    }

    private isNothingSelected(): boolean {
        return !this.editor.somethingSelected();
    }

    // private isSelectionWithinRange(range: IndexRange): boolean { // NOT USED ??
    //     if (this.isNothingSelected())
    //         return false; // Satisfy that range is greater than 0
    //     const from = this.editor.posToOffset(this.editor.getCursor('from'));
    //     const to = this.editor.posToOffset(this.editor.getCursor('to'));
    //     return (from >= range.startIndex) && (to <= range.endIndex);  // USING INDEXES HERE
    // }

    private isFullRangeSelected(range: EditorRange): boolean {
        if (this.editor.somethingSelected()) {
            const fromIndex = this.editor.posToOffset(this.editor.getCursor('from'));
            const toIndex = this.editor.posToOffset(this.editor.getCursor('to'));
            const startIndex = this.editor.posToOffset(range.from);
            const endIndex = this.editor.posToOffset(range.to);
            return (fromIndex === startIndex) && (toIndex === endIndex); // USING INDEXES HERE
        }
        return false;
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
        return toRange(toPos(startLine, 0) , toPos(endLine, text.length));
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
function toSelection(anchor: EditorPosition, head: EditorPosition): EditorSelection {
    return { anchor: anchor, head: head };
}
function toRange(from: EditorPosition, to: EditorPosition): EditorRange {
    return { from: from, to: to };
}
