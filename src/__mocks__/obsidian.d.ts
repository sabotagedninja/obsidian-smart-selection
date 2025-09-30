
export type EditorPosition = { line: number; ch: number };
export type EditorRange = { from: EditorPosition; to: EditorPosition };
export type EditorSelection = { anchor: EditorPosition; head: EditorPosition };
export type EditorSelectionOrCaret = { anchor: EditorPosition; head?: EditorPosition };
export type EditorCommandName = unknown;
export type EditorTransaction = unknown;
export type EditorChange = unknown;

export interface Editor {
    getDoc(): this;
    refresh(): void;
    getValue(): string;
    setValue(content: string): void;
    getLine(line: number): string;
    setLine(n: number, text: string): void;
    lineCount(): number;
    lastLine(): number;
    getSelection(): string;
    somethingSelected(): boolean;
    getRange(from: EditorPosition, to: EditorPosition): string;
    replaceSelection(replacement: string, origin?: string): void;
    replaceRange(replacement: string, from: EditorPosition, to?: EditorPosition, origin?: string): void;
    getCursor(string?: 'from' | 'to' | 'head' | 'anchor'): EditorPosition;
    listSelections(): EditorSelection[];
    setCursor(pos: EditorPosition | number, ch?: number): void;
    setSelection(anchor: EditorPosition, head?: EditorPosition): void;
    setSelections(ranges: EditorSelectionOrCaret[], main?: number): void;
    focus(): void;
    blur(): void;
    hasFocus(): boolean;
    getScrollInfo(): {top: number, left: number};
    scrollTo(x?: number | null, y?: number | null): void;
    scrollIntoView(range: EditorRange, center?: boolean): void;
    undo(): void;
    redo(): void;
    exec(command: EditorCommandName): void;
    transaction(tx: EditorTransaction, origin?: string): void;
    wordAt(pos: EditorPosition): EditorRange | null;
    posToOffset(pos: EditorPosition): number;
    offsetToPos(offset: number): EditorPosition;
    processLines<T>(read: (line: number, lineText: string) => T | null, write: (line: number, lineText: string, value: T | null) => EditorChange | void, ignoreEmpty?: boolean): void;
}
