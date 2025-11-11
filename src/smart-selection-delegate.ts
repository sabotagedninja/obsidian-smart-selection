import { Editor, EditorPosition, EditorRange } from 'obsidian';
import {
    toPos, 
    toRange, 
    toSelection, 
    posEquals, 
    posGTE, 
    posGT, 
    posLTE, 
    posLT, 
    rangeEquals, 
    rangeContains, 
    rangeContainsPartial, 
    rangeContainsPos, 
    rangeIntersects, 
    getIntersection, 
    getUnion
} from './functions'
import { debug, trace_r } from './dev-utils';
import { Graph, Node } from './ast-processor';

export default class SmartSelectionDelegate {
    private editor: Editor;
    private graph: Graph | null;
    private origin: EditorPosition;

    getEditor(): Editor {
        return this.editor;
    }

    setEditor(editor: Editor): void {
        this.editor = editor;
    }

    getGraph(): Graph | null {
        return this.graph;
    }

    setGraph(graph: Graph | null) {
        this.graph = graph;
    }

    private checkEditor() {
        if (!this.editor) throw new ReferenceError('editor not set');
    }

    // Important to note: The origin cursor will only stay in effect when it is inside the selection range. 
    // If not, the origin cursor is reset to the selection anchor. This happens in initOriginCursor() prior to any expand/shrink operation.
    // 
    // All operations are performed around the origin. 
    // So, you should read selectLine() as "select the line where the origin lies".
    // Same for paragraph and document (but there is only just he one document :)

    expandSelection(): void {
        trace_r();
        this.checkEditor();
        this.initOriginCursor();
        const $ = this; // Scope variable for nested functions
        const origin = this.origin;
        const from = this.editor.getCursor('from');
        const to = this.editor.getCursor('to');
        const selection = toRange(from, to);
        const word = this.getWordRange(origin);
        const line = this.getLineRange(origin);
        const paragraph = this.getParagraphRange(origin);
        const paragraphFrom = this.getParagraphRange(from);
        const paragraphTo = this.getParagraphRange(to);
        const paragraphsFromTo = getUnion(paragraphFrom, paragraphTo);
        const document = this.getDocumentRange();

        if (this.graph) {
            // Use the graph to make smarter selection expansions based on the document structure
            const node = this.graph.getNodeAtPosition(origin);
            debug('Node at origin: ', node);
            if (node) {
                const range = toRange(
                    this.editor.offsetToPos(node.from),
                    this.editor.offsetToPos(node.to)
                );
                $.setSelection(range);
            }
        } else {
            if (nothingIsSelected()) {
            selectWord();
            if (nothingIsSelected()) { // Blank line
                // TODO what is the next logical step?
                selectLine();
                if (nothingIsSelected()) { // Blank line
                    selectParagraph();
                    if (nothingIsSelected()) { // Blank line surrounded by blank lines
                        selectDocument();
                    }
                }
            }
            
                // Something is selected
            } else if (selectionIsOnSingleLine()) {
                if (wordIsPartiallySelected()) {
                    selectWord();
                } else if (lineIsPartiallySelected()) {
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
        }
        
        trace_r('-- EOF --');
        
        function nothingIsSelected() {
            return trace_r($.isNothingSelected());
        }

        function selectionIsOnSingleLine() {
            return trace_r(from.line === to.line);
        }

        function wordIsPartiallySelected() {
            return trace_r(rangeContainsPartial(word, selection));
        }

        function lineIsPartiallySelected() {
            return trace_r(rangeContainsPartial(line, selection));
        }

        function lineIsFullySelectedAndIsAlsoAParagraph() {
            return trace_r(rangeEquals(paragraph, selection));
        }

        function oneOrMoreParagraphsArePartiallySelected() {
            return trace_r(rangeContainsPartial(paragraphsFromTo, selection));
        }

        function selectWord() {
            trace_r();
            $.setSelection(word);
        }
        
        function selectLine() {
            trace_r();
            $.setSelection(line);
        }

        function selectParagraph() {
            trace_r();
            $.setSelection(paragraph);
        }
        
        function selectOneOrMoreParagraphs() {
            trace_r();
            $.setSelection(paragraphsFromTo);
        }

        function selectDocument() {
            trace_r();
            $.setSelection(document);
        }
    }

    shrinkSelection(): void {
        trace_r();
        this.checkEditor();
        this.initOriginCursor();
        const $ = this; // Scope variable for nested functions
        const origin = this.origin;
        const from = this.editor.getCursor('from');
        const to = this.editor.getCursor('to');
        const selection = toRange(from, to);
        const word = this.getWordRange(origin);
        const line = this.getLineRange(origin);
        const paragraph = this.getParagraphRange(origin);

        if (nothingIsSelected()) {
            return;

        } else if (selectionIsOnSingleLine()) { // Full or partial
            if (wordIsFullyOrPartiallySelected()) {
                restoreOriginCursor();
            } else if (lineIsFullyOrPartiallySelected()) {
                selectWord(); // Could be partial
            }

        } else if (paragraphIsFullyOrPartiallySelected()) { // At least two lines, full or partial, within origin paragraph
            selectLine(); // Could be partial

        } else {
            selectParagraph(); // Could be partial
        }

        trace_r('-- EOF --');

        function nothingIsSelected() {
            return trace_r($.isNothingSelected());
        }

        function selectionIsOnSingleLine() {
            return trace_r(from.line === to.line);
        }

        function wordIsFullyOrPartiallySelected() {
            return trace_r(rangeContains(word, selection));
        }

        function lineIsFullyOrPartiallySelected() {
            return trace_r(rangeContains(line, selection));
        }

        function paragraphIsFullyOrPartiallySelected() {
            return trace_r(rangeContains(paragraph, selection));
        }

        function restoreOriginCursor() {
            trace_r();
            $.setCursor(origin);
        }

        function selectWord() {
            trace_r();
            // If word was partially selected, select only that part
            // getIntersection will never return null within this context, but I must handle the case (therefor default to word)
            $.setSelection(getIntersection(word, selection) || word);
        }

        function selectLine() {
            trace_r();
            // If line was partially selected, select only that part
            // getIntersection will never return null within this context, but I must handle the case (therefor default to line)
            $.setSelection(getIntersection(line, selection) || line);
        }

        function selectParagraph() {
            trace_r();
            // If paragraph was partially selected, select only that part
            // getIntersection will never return null within this context, but I must handle the case (therefor default to paragraph)
            $.setSelection(getIntersection(paragraph, selection) || paragraph);
        }
    }

    private initOriginCursor(): void {
        const from = this.editor.getCursor('from');
        const to = this.editor.getCursor('to');
        const anchor = this.editor.getCursor('anchor');
        // If origin cursor is not set, nothing is selected, or origin cursor is outside of the selection
        if (!this.origin || this.isNothingSelected() || !rangeContainsPos(toRange(from, to), this.origin)) {
            this.origin = anchor;
            debug('(re)setting origin cursor to: ', JSON.stringify(anchor));
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

    private getWordRange(pos: EditorPosition): EditorRange {
        return this.editor.wordAt(pos) || toRange(pos, pos);
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
