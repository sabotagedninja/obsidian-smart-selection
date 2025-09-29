import { EditorPosition } from "obsidian";
import { off } from "process";
import { EditorInterface } from "src/main/selection-expander-logic";

export class SimpleMockEditor implements EditorInterface {
    private lines: string[];
    private sel: { from: EditorPosition; to: EditorPosition };

    constructor(content: string) {
        this.lines = content.split('\n');
        this.sel = { from: { line: 0, ch: 0 }, to: { line: 0, ch: 0 } };
    }

    getSelection(): string {
        const { from, to } = this.sel;
        if (from.line === to.line) {
            return this.lines[from.line].slice(from.ch, to.ch);
        }
        // simplistic multiline support
        let out = '';
        for (let ln = from.line; ln <= to.line; ln++) {
            const line = this.lines[ln];
            if (ln === from.line && ln === to.line) {
                out += line.slice(from.ch, to.ch);
            } else if (ln === from.line) {
                out += line.slice(from.ch) + '\n';
            } else if (ln === to.line) {
                out += line.slice(0, to.ch);
            } else {
                out += line + '\n';
            }
        }
        return out;
    }

    getCursor(which: 'from' | 'to' = 'to') {
        return this.sel[which];
    }

    setCursor(pos: EditorPosition) {
        this.sel = { from: pos, to: pos };
    }

    setSelection(from: EditorPosition, to: EditorPosition) {
        this.sel = { from, to };
    }

    getLine(line: number): string {
        return this.lines[line] ?? '';
    }

    lineCount(): number {
        return this.lines.length;
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
            remaining -= lineLen + 1; // newline
        }
        // clamp to end of last line
        return {
            line: this.lines.length - 1,
            ch: this.lines[this.lines.length - 1].length,
        };
    }
}
