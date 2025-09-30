
export type EditorPosition = { line: number; ch: number };
export type EditorRange = { from: EditorPosition; to: EditorPosition };
export type EditorSelection = { anchor: EditorPosition; head: EditorPosition };
export type EditorSelectionOrCaret = EditorSelection | EditorPosition;

export interface Editor {
    getLine(line: number): string;
    lineCount(): number;
    lastLine(): number;
    somethingSelected(): boolean;
    getSelection(): string;
    setSelection(anchor: EditorPosition, head?: EditorPosition): void;
    getRange(from: EditorPosition, to: EditorPosition): string;
    getCursor(which?: 'from' | 'to' | 'head' | 'anchor'): EditorPosition;
    setCursor(pos: EditorPosition | number, ch?: number): void;
    wordAt(pos: EditorPosition): EditorRange | null;
    posToOffset(pos: EditorPosition): number;
    offsetToPos(offset: number): EditorPosition;
}
