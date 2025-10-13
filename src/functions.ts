import { EditorPosition, EditorRange, EditorSelection } from 'obsidian';

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
