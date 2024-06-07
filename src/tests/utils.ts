import { Caret, Selection, expand } from '../main/algorithm'

export function findCaretIndexes(str: string): number[] {
    const indexes: number[] = [];
    for (let i = 0; i < str.length; i++) {
        if (str[i] === '|') {
            // In the string '|a|' the second caret is at index 2,
            // but the caret symbols should not be counted as characters!
            // Therefor, subtract the number of carets already counted from the next caret index
            indexes.push(i - indexes.length);
        }
    }
    return indexes;
}

export function removeCarets(str: string): string {
    return str.replace(/\|/g, '',)
}

export function _expand(textWithCarets: string): string {
    var text = removeCarets(textWithCarets)
    var carets = findCaretIndexes(textWithCarets)
    if (carets.length === 1) {
        return expand(new Caret(text, carets[0])).selectedText
    } else {
        return expand(new Selection(text, carets[0], carets[1])).selectedText
    }
}
