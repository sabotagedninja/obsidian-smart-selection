import type { Editor, EditorChange, EditorCommandName, EditorPosition, EditorRange } from './obsidian';


abstract class AbstractEditor implements Editor {
    getDoc(): this {
        throw new Error('Method not implemented.');
    }
    refresh(): void {
        throw new Error('Method not implemented.');
    }
    getValue(): string {
        throw new Error('Method not implemented.');
    }
    setValue(content: string): void {
        throw new Error('Method not implemented.');
    }
    getLine(line: number): string {
        throw new Error('Method not implemented.');
    }
    setLine(n: number, text: string): void {
        throw new Error('Method not implemented.');
    }
    lineCount(): number {
        throw new Error('Method not implemented.');
    }
    lastLine(): number {
        throw new Error('Method not implemented.');
    }
    getSelection(): string {
        throw new Error('Method not implemented.');
    }
    somethingSelected(): boolean {
        throw new Error('Method not implemented.');
    }
    getRange(from: EditorPosition, to: EditorPosition): string {
        throw new Error('Method not implemented.');
    }
    replaceSelection(replacement: string, origin?: string): void {
        throw new Error('Method not implemented.');
    }
    replaceRange(replacement: string, from: EditorPosition, to?: EditorPosition, origin?: string): void {
        throw new Error('Method not implemented.');
    }
    getCursor(string?: 'from' | 'to' | 'head' | 'anchor'): EditorPosition {
        throw new Error('Method not implemented.');
    }
    listSelections(): EditorSelection[] {
        throw new Error('Method not implemented.');
    }
    setCursor(pos: EditorPosition | number, ch?: number): void {
        throw new Error('Method not implemented.');
    }
    setSelection(anchor: EditorPosition, head?: EditorPosition): void {
        throw new Error('Method not implemented.');
    }
    setSelections(ranges: EditorSelectionOrCaret[], main?: number): void {
        throw new Error('Method not implemented.');
    }
    focus(): void {
        throw new Error('Method not implemented.');
    }
    blur(): void {
        throw new Error('Method not implemented.');
    }
    hasFocus(): boolean {
        throw new Error('Method not implemented.');
    }
    getScrollInfo(): { top: number; left: number; } {
        throw new Error('Method not implemented.');
    }
    scrollTo(x?: number | null, y?: number | null): void {
        throw new Error('Method not implemented.');
    }
    scrollIntoView(range: EditorRange, center?: boolean): void {
        throw new Error('Method not implemented.');
    }
    undo(): void {
        throw new Error('Method not implemented.');
    }
    redo(): void {
        throw new Error('Method not implemented.');
    }
    exec(command: EditorCommandName): void {
        throw new Error('Method not implemented.');
    }
    transaction(tx: EditorTransaction, origin?: string): void {
        throw new Error('Method not implemented.');
    }
    wordAt(pos: EditorPosition): EditorRange | null {
        throw new Error('Method not implemented.');
    }
    posToOffset(pos: EditorPosition): number {
        throw new Error('Method not implemented.');
    }
    offsetToPos(offset: number): EditorPosition {
        throw new Error('Method not implemented.');
    }
    processLines<T>(read: (line: number, lineText: string) => T | null, write: (line: number, lineText: string, value: T | null) => EditorChange | void, ignoreEmpty?: boolean): void {
        throw new Error('Method not implemented.');
    }   
}

export default class SimpleMockEditor extends AbstractEditor {

    private lines: string[];
    private pos: {
        from: EditorPosition;
        to: EditorPosition;
        head: EditorPosition;
        anchor: EditorPosition;
    };

    constructor(content: string) {
        super();
        this.lines = content.split('\n');
        this.pos = { 
            from: { line: 0, ch: 0 }, 
            to: { line: 0, ch: 0 },
            head: { line: 0, ch: 0 },
            anchor: { line: 0, ch: 0 }
        };
    }

    getValue(): string {
        return this.lines.join('\n');
    }
    setValue(content: string): void {
        this.lines = content.split('\n');
        this.setCursor({ line: 0, ch: 0 });
    }
    getLine(line: number): string {
        return this.lines[line] ?? null;
    }
    lineCount(): number {
        return this.lines.length;
    }
    lastLine(): number {
        return this.lines.length - 1;
    }
    somethingSelected(): boolean {
        return (
            this.pos.from.line !== this.pos.to.line ||
            this.pos.from.ch !== this.pos.to.ch
        );
    }
    getSelection(): string {
        var start = this.posToOffset(this.pos.from);
        var end = this.posToOffset(this.pos.to);
        return this.getValue().slice(start, end);
    }
    setSelection(anchor: EditorPosition, head?: EditorPosition): void {
        // var from = anchor;
        // var to = anchor;
        // if (head /* is not null*/) {
        //     if (this.posToOffset(anchor) < this.posToOffset(head)) {
        //         from = anchor
        //         to = head
        //     } else /* gte */ {
        //         from = head
        //         to = anchor
        //     }
        // }
        // this.pos = { from: from, to: to, anchor: anchor, head: head };
        const startOffset = this.posToOffset(anchor);
        const endOffset = this.posToOffset(head ?? anchor);
        const from = startOffset <= endOffset ? anchor : head ?? anchor;
        const to = startOffset <= endOffset ? head ?? anchor : anchor;
        this.pos = {
            from,
            to,
            anchor,
            head: head ?? anchor,
        };
    }
    getRange(from: EditorPosition, to: EditorPosition): string {
        const start = this.posToOffset(from);
        const end = this.posToOffset(to);
        return this.getValue().slice(start, end);
    }
    getCursor(which: 'from' | 'to' | 'head' | 'anchor' = 'head'): EditorPosition {
        return this.pos[which];
    }
    setCursor(pos: EditorPosition | number, ch?: number): void {
        let cursor: EditorPosition;
        if (typeof pos === 'number') {
            cursor = { line: pos, ch: ch ?? 0 };
        } else {
            cursor = pos;
        }
        this.pos = {
            from: cursor,
            to: cursor,
            head: cursor,
            anchor: cursor,
        };
    }
    wordAt(pos: EditorPosition): EditorRange | null {
        const line = this.getLine(pos.line);
        if (!line) return null;
        const re = /\w+/g;
        let match: RegExpExecArray | null;
        while ((match = re.exec(line)) !== null) {
            const start = match.index;
            const end = start + match[0].length;
            if (pos.ch >= start && pos.ch <= end) {
                return {
                    from: { line: pos.line, ch: start },
                    to: { line: pos.line, ch: end },
                };
            }
        }
        return null;
    }
    posToOffset(pos: EditorPosition): number {
        let offset = 0;
        for (let i = 0; i < pos.line; i++) {
            offset += this.lines[i].length + 1; // +1 for newline
        }
        return offset + pos.ch;
    }
    offsetToPos(offset: number): EditorPosition {
        let remaining = offset;
        for (let line = 0; line < this.lines.length; line++) {
            const lineLen = this.lines[line].length;
            if (remaining <= lineLen) {
                return { line, ch: remaining };
            }
            remaining -= lineLen + 1; // +1 for newline
        }
        return { // clamp to end of last line
            line: this.lines.length - 1,
            ch: this.lines[this.lines.length - 1].length,
        };
    }
}
