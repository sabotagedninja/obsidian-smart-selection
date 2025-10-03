import { Editor, EditorPosition, EditorRange, EditorSelection } from 'obsidian';

export default class SelectionExpanderPluginImpl {
    private editor: Editor;
    private origin: EditorPosition;

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
        const $ = this; // Scope variable for nested functions
        const editor = this.editor;
        const origin = this.initOriginCursor();
        const from = this.editor.getCursor('from');
        const to = this.editor.getCursor('to');
        const selection = toRange(from, to);
        const line = this.getLineRange(origin);
        const paragraph = this.getParagraphRange(origin);
        const paragraphFrom = this.getParagraphRange(from);
        const paragraphTo = this.getParagraphRange(to);
        const document = this.getDocumentRange();

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
                if (lineIsPartiallySelected()) {
                    selectLine();
                } else { // Line is fully selected. Could as well be a paragraph. Check for that
                    if (paragraphIsFullySelected()) {
                        selectDocument();
                    } else {
                        selectParagraph();
                    }
                }
            } else { // Selection spans multiple lines
                // Selection could be contained inside one paragraph, or it could span multiple paragraphs (calculation is the same)
                // If one paragraph is partially selected, then range2 is the same as range1
                if (eitherParagraphsArePartiallySelected()) {
                    $.setSelection(toRange(paragraphFrom.from, paragraphTo.to)); // Custom range
                } else {
                    selectDocument();
                }
            }
        }

        // TODO Move these methods down to class level
        // TODO register every important function call so that I can see the path travelled through the code - RedLine.register()
        // TODO remove log(TRACE)

        function nothingIsSelected() {
            const result = $.isNothingSelected();
            console.log('TRACE: nothingSelected() ?: ', result);
            return result;
        }

        function selectionIsOnSingleLine() {
            const result = from.line === to.line;
            console.log('TRACE: selectionIsOnSingleLine() ?: ', result);
            return result;
        }

        /*
            FIXME Below two methods look different but are essentially the same:
        
            lineIsPartiallySelected <=> eitherParagraphsArePartiallySelected
            ****IsPartiallySelected <=> either**********ArePartiallySelected

            lineIsPartiallySelected                   tests if a range is not fully selected, and...
            eitherParagraphsArePartiallySelected also tests if a range is not fully selected

            To test this, pass the same lineRange object to eitherParagraphsArePartiallySelected and the result is the same!
            However, eitherParagraphsArePartiallySelected performs less calculations than lineIsPartiallySelected.
            
            So... can i combine these into one?
        */

        function lineIsPartiallySelected() {
            // Check if selection is contained within the bounds of the line (but not equal to)
            const result = rangeContains(selection, line) && !rangeEquals(selection, line);
            console.log('TRACE: lineIsPartiallySelected() ?: ', result);
            return result;
        }

        function eitherParagraphsArePartiallySelected() {
            // Both paragraphs are fully selected if:
            //   - the start of the selection is equal to the start of paragraph 1.
            //   - the end of the selection is equal to the end of paragraph 2.
            //   - i.e. selection is equal to the union of both paragraphs
            // Either paragraphs are only partially selected when this is not the case (only one needs to be true).
            const result = !posEquals(selection.from, paragraphFrom.from) || !posEquals(selection.to, paragraphTo.to);
            console.log('TRACE: eitherParagraphsArePartiallySelected() ?: ', result);
            return result;
        }

        function paragraphIsFullySelected() {
            const result = rangeEquals(selection, paragraph);
            console.log('TRACE: paragraphIsFullySelected() ?: ', result);
            return result;
        }

        function selectLine() {
            console.log('TRACE: selectLine()');
            $.setSelection(line);
        }

        function selectParagraph() {
            console.log('TRACE: selectParagraph()');
            $.setSelection(paragraph);
        }

        function selectDocument() {
            console.log('TRACE: selectDocument()');
            $.setSelection(document);
        }
    }

    shrinkSelection(): void {
        this.checkEditor();
        const $ = this; // Scope variable for nested functions
        const editor = this.editor;
        const origin = this.initOriginCursor();
        const from = this.editor.getCursor('from');
        const to = this.editor.getCursor('to');
        const selectionRange = toRange(from, to);
        const lineRange = this.getLineRange(origin);
        const paragraphRange = this.getParagraphRange(origin);
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
            $.setCursor(origin);
        }

        function selectLine() {
            console.log('TRACE: selectLine()');
            $.setSelection(lineRange);
        }

        function selectParagraph() {
            console.log('TRACE: selectParagraph()');
            $.setSelection(paragraphRange);
        }
    }

    private initOriginCursor(): EditorPosition {
        const anchor = this.editor.getCursor('anchor');
        const from = this.editor.getCursor('from');
        const to = this.editor.getCursor('to');
        // If origin cursor is not set or nothing is selected
        if (!this.origin || this.isNothingSelected()) {
            console.log('(re)setting origin cursor to: ', JSON.stringify(anchor));
            return this.origin = anchor;
        }
        // If origin cursor is outside of the selection
        if (!rangeContainsPos(this.origin, toRange(from, to))) {
            console.log('(re)setting origin cursor to: ', JSON.stringify(anchor));
            return this.origin = anchor
        }
        return this.origin;
    }

    private isNothingSelected(): boolean {
        return !this.editor.somethingSelected();
    }

    private setSelection(range: EditorRange) {
        this.editor.setSelection(range.from, range.to);
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
function rangeContainsPos(pos: EditorPosition, range: EditorRange): boolean {
    return posGTE(pos, range.from) && posLTE(pos, range.to);
}
function rangeOverlaps(r1: EditorRange, r2: EditorRange): boolean {
    return posLTE(r1.from, r2.to) && posGTE(r1.to, r2.from);
}
function getStackTrace(): string {
    if ("captureStackTrace" in Error) {
        const obj = {};
        // Avoid getStackTrace itself in the stack trace
        Error.captureStackTrace(obj, getStackTrace);
        const stacktrace = (obj as any).stack;
        // Process stacktrace - remove anything outside of this plugin
        const lines: string[] = [];
        var quit = false;
        stacktrace.split('\n').forEach((line: string) => {
            if (quit) return;
            line = line.trim();
            if (line == 'Error:') return;
            line = line.replace('SelectionExpanderPluginImpl.', '').replace(/^at\s/, '').replace(/\(.+?\)/, '');
            lines.push("  " + line);
            if (line.includes('expandSelection') || line.includes('shrinkSelection')) {
                quit = true;
            }
        });
        return "Stacktrace:\n" + lines.join('\n');
    }
    return null;
}