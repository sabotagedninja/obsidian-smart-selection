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

    // Important to note: The origin cursor will only stay in effect when it is inside the selection range. 
    // If not, the origin cursor is reset to the selection anchor. This happens in initOriginCursor() prior to any expand/shrink operation.
    // 
    // All operations are performed around the origin. 
    // So, you should read selectLine() as "select the line where the origin lies".
    // Same for paragraph and document (but there is only just he one document :)

    expandSelection(): void {
        this.checkEditor();
        this.initOriginCursor();
        const $ = this; // Scope variable for nested functions
        const origin = this.origin;
        const from = this.editor.getCursor('from');
        const to = this.editor.getCursor('to');
        const selection = toRange(from, to);
        const line = this.getLineRange(origin);
        const paragraph = this.getParagraphRange(origin);
        const paragraphFrom = this.getParagraphRange(from);
        const paragraphTo = this.getParagraphRange(to);
        const paragraphsFromTo = getUnion(paragraphFrom, paragraphTo);
        const document = this.getDocumentRange();

        if (nothingIsSelected()) {
            selectLine();
            if (nothingIsSelected()) { // Blank line
                selectParagraph();
                if (nothingIsSelected()) { // Blank line surrounded by blank lines
                    selectDocument();
                }
            }

            // Something is selected
        } else if (selectionIsOnSingleLine()) {
            if (lineIsPartiallySelected()) {
                selectLine();
            } else if (lineIsFullySelectedAndIsAlsoAParagraph()) {
                selectDocument();
            } else {
                selectParagraph();
            }

            // Selection spans multiple lines
        } else if (oneOrMoreParagraphsArePartiallySelected()) { // Not fully!
            selectOneOrMoreParagraphs();

            // One or more paragraphs are fully selected
        } else {
            selectDocument();
        }

        // TODO register every important function call so that I can see the path travelled through the code - RedLine.register()
        // TODO remove log(TRACE)

        function nothingIsSelected() {
            const result = $.isNothingSelected();
            console.log('TRACE: nothingIsSelected() ?: ', result);
            return result;
        }

        function selectionIsOnSingleLine() {
            const result = from.line === to.line;
            console.log('TRACE: selectionIsOnSingleLine() ?: ', result);
            return result;
        }

        function lineIsPartiallySelected() {
            const result = rangeContainsPartial(line, selection);
            console.log('TRACE: lineIsPartiallySelected() ?: ', result);
            return result;
        }

        function lineIsFullySelectedAndIsAlsoAParagraph() {
            const result = rangeEquals(paragraph, selection);
            console.log('TRACE: lineIsFullySelectedAndIsAlsoAParagraph() ?: ', result);
            return result;
        }

        function oneOrMoreParagraphsArePartiallySelected() {
            const result = rangeContainsPartial(paragraphsFromTo, selection);
            console.log('TRACE: oneOrMoreParagraphsArePartiallySelected() ?: ', result);
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
        
        function selectOneOrMoreParagraphs() {
            console.log('TRACE: selectOneOrMoreParagraphs()');
            $.setSelection(paragraphsFromTo); // Still works if both ranges are the same paragraph
        }

        function selectDocument() {
            console.log('TRACE: selectDocument()');
            $.setSelection(document);
        }
    }

    shrinkSelection(): void {
        this.checkEditor();
        this.initOriginCursor();
        const $ = this; // Scope variable for nested functions
        const origin = this.origin;
        const from = this.editor.getCursor('from');
        const to = this.editor.getCursor('to');
        const selection = toRange(from, to);
        const line = this.getLineRange(origin);
        const paragraph = this.getParagraphRange(origin);

        if (nothingIsSelected()) {
            return;

        } else if (selectionIsOnSingleLine()) { // Full or partial
            restoreOriginCursor();

        } else if (paragraphIsFullyOrPartiallySelected()) { // At least two lines, full or partial, within origin paragraph
            selectLine(); // Could be partial

        } else {
            selectParagraph(); // Could be partial
        }

        function nothingIsSelected() {
            const result = $.isNothingSelected();
            console.log('TRACE: nothingIsSelected() ?: ', result);
            return result;
        }

        function selectionIsOnSingleLine() {
            const result = from.line === to.line;
            console.log('TRACE: selectionIsOnSingleLine() ?: ', result);
            return result;
        }

        function paragraphIsFullyOrPartiallySelected() {
            const result = rangeContains(paragraph, selection);
            console.log('TRACE: paragraphIsFullyOrPartiallySelected() ?: ', result);
            return result;
        }

        function restoreOriginCursor() {
            console.log('TRACE: restoreCursor()');
            $.setCursor(origin);
        }

        function selectLine() {
            console.log('TRACE: selectLine()');
            $.setSelection(getIntersection(line, selection)); // If line was partially selected, select only that part
        }

        function selectParagraph() {
            console.log('TRACE: selectParagraph()');
            $.setSelection(getIntersection(paragraph, selection)); // If paragraph was partially selected, select only that part
        }
    }

    private initOriginCursor(): void {
        const anchor = this.editor.getCursor('anchor');
        const from = this.editor.getCursor('from');
        const to = this.editor.getCursor('to');
        // If origin cursor is not set, nothing is selected, or origin cursor is outside of the selection
        if (!this.origin ||
            this.isNothingSelected() ||
            !rangeContainsPos(toRange(from, to), this.origin)
        ) {
            console.log('(re)setting origin cursor to: ', JSON.stringify(anchor));
            this.origin = anchor;
        }
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



export function toPos(line: number, ch: number): EditorPosition {
    return { line: line, ch: ch };
}
export function toRange(from: EditorPosition, to: EditorPosition): EditorRange {
    return { from: from, to: to };
}
export function toSelection(anchor: EditorPosition, head: EditorPosition): EditorSelection;
export function toSelection(range: EditorRange): EditorSelection;
export function toSelection(a: EditorPosition | EditorRange, b?: EditorPosition): EditorSelection {
    if ("from" in a && "to" in a) {
        return { anchor: a.from, head: a.to };
    } else {
        if (!b) throw new Error("Head position missing");
        return { anchor: a, head: b };
    }
}
export function posEquals(a: EditorPosition, b: EditorPosition): boolean {
    return a.line == b.line && a.ch == b.ch;
}
export function posGTE(a: EditorPosition, b: EditorPosition): boolean {
    if (a.line < b.line) return false;
    if (a.line > b.line) return true;
    return a.ch >= b.ch;
}
export function posGT(a: EditorPosition, b: EditorPosition): boolean {
    if (a.line < b.line) return false;
    if (a.line > b.line) return true;
    return a.ch > b.ch;
}
export function posLTE(a: EditorPosition, b: EditorPosition): boolean {
    if (a.line < b.line) return true;
    if (a.line > b.line) return false;
    return a.ch <= b.ch;
}
export function posLT(a: EditorPosition, b: EditorPosition): boolean {
    if (a.line < b.line) return true;
    if (a.line > b.line) return false;
    return a.ch < b.ch;
}
export function rangeEquals(a: EditorRange, b: EditorRange): boolean {
    return posEquals(a.from, b.from) && posEquals(a.to, b.to);
}
/** Fully or partial */
export function rangeContains(a: EditorRange, b: EditorRange): boolean {
    return posLTE(a.from, b.from) && posGTE(a.to, b.to);
}
/** Exclusively partial */
export function rangeContainsPartial(a: EditorRange, b: EditorRange): boolean {
    return rangeContains(a, b) && !rangeEquals(a, b);
}
export function rangeContainsPos(range: EditorRange, pos: EditorPosition): boolean {
    return posGTE(pos, range.from) && posLTE(pos, range.to);
}
export function rangeIntersects(a: EditorRange, b: EditorRange): boolean {
    return posLT(a.from, b.to) && posGT(a.to, b.from);
}
export function getIntersection(a: EditorRange, b: EditorRange): EditorRange | null {
    const from = posGTE(a.from, b.from) ? a.from : b.from;
    const to = posLTE(a.to, b.to) ? a.to : b.to;
    // Valid intersection exists only if from < to
    if (posLT(from, to)) {
        return { from, to };
    }
    return null;
}
export function getUnion(a: EditorRange, b: EditorRange): EditorRange {
    const from = posLTE(a.from, b.from) ? a.from : b.from;
    const to = posGTE(a.to, b.to) ? a.to : b.to;
    return { from, to };
}




export function getStackTrace(): string {
    if ("captureStackTrace" in Error) {
        const obj = {};
        // Avoid getStackTrace itself in the stack trace
        Error.captureStackTrace(obj, getStackTrace);
        const stacktrace = (obj as any).stack;
        // Process stacktrace - remove anything outside of this plugin
        const lines: string[] = [];
        let quit = false;
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
