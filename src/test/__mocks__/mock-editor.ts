import type { Editor, EditorPosition, EditorRange, EditorSelection, EditorSelectionOrCaret } from './obsidian';

export class MockEditor implements Editor {
    
    private lines: string[];
    private pos: {
        from: EditorPosition;
        to: EditorPosition;
        head: EditorPosition;
        anchor: EditorPosition;
    };

    constructor(content: string) {
        this.lines = content.split('\n');
        this.pos = { 
            from: { line: 0, ch: 0 }, 
            to: { line: 0, ch: 0 },
            head: { line: 0, ch: 0 },
            anchor: { line: 0, ch: 0 }
        };
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
        throw new Error('Method not implemented.');
    }
    getSelection(): string {
        const { from, to } = this.pos;
        var start = this.posToOffset(this.pos.from);
        var end = this.posToOffset(this.pos.to);
        return this.lines.join("\n").slice(start, end);
    }
    setSelection(anchor: EditorPosition, head?: EditorPosition): void {
        var from = anchor;
        var to = anchor;
        if (head /* is not null*/) {
            if (this.posToOffset(anchor) < this.posToOffset(head)) {
                from = anchor
                to = head
            } else /* gte */ {
                from = head
                to = anchor
            }
        }
        this.pos = { from: from, to: to, anchor: anchor, head: head };
    }
    getRange(from: EditorPosition, to: EditorPosition): string {
        throw new Error("Method not implemented.");
    }
    getCursor(which?: "from" | "to" | "head" | "anchor"): EditorPosition {
        return this.pos[which];
    }
    setCursor(pos: EditorPosition | number, ch?: number): void {
        // this.pos = { from: pos, to: pos };
        throw new Error('Method not implemented.');
    }
    wordAt(pos: EditorPosition): EditorRange | null {
        throw new Error("Method not implemented.");
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
        // clamp to end of last line
        return {
            line: this.lines.length - 1,
            ch: this.lines[this.lines.length - 1].length,
        };
    }
}
