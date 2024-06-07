
enum CharType {
    CHARACTER, WHITESPACE, PUNCTUATION_MARK,
    NONE // FIXME Hacky!
}

function getCharType(char: string): CharType {
    if (char.length == 0)
        return CharType.NONE // FIXME Hacky!
    else if (char.match('[\\w-]'))
        return CharType.CHARACTER
    else if (char.match('\\s'))
        return CharType.WHITESPACE
    else
        return CharType.PUNCTUATION_MARK
}

// FIXME When there is no selection yet, just a caret position, should I create another class for that?
// ?? When text is selected, where should the cursor be placed? Original position? At start or end?
// When nothing selected, just a cursor, Selection = {'a|b', 1, 1, 1}
// When selected, Selection = {'a|b|c',}

export class Caret {
    readonly text: string
    readonly caretPos: number

    constructor(text: string, caretPos: number) {
        if (text == null) throw new Error('text may not be null')
        if (caretPos < 0) throw new Error('caretPos must be >= 0')
        this.text = text
        this.caretPos = caretPos
    }
}

export class Selection extends Caret {
    readonly selectionStart: number
    readonly selectionEnd: number
    readonly selectedText: string

    constructor(text: string, selectionStart: number, selectionEnd: number) {
        super(text, selectionStart)
        if (text == null) throw new Error('text may not be null')
        if (selectionStart < 0) throw new Error('selectionStart must be >= 0')
        if (selectionEnd < selectionStart) throw new Error('selectionEnd must be >= selectionStart')
        this.selectionStart = selectionStart
        this.selectionEnd = selectionEnd
        this.selectedText = text.substring(selectionStart, selectionEnd)
    }

    static of(selection: Caret | Selection): Selection {
        if (selection instanceof Selection) {
            return selection
        } else {
            return new Selection(selection.text, selection.caretPos, selection.caretPos)
        }
    }
}

export function expand(selection: Caret | Selection): Selection {
    const _selection = Selection.of(selection)
    if (selection.text.length == 0) {
        return _selection
    }
    const text = selection.text
    var selectionStart = _selection.selectionStart
    var selectionEnd = _selection.selectionEnd
    const charTypeStart = getCharType(text.charAt(selectionStart - 1))
    const charTypeEnd = getCharType(text.charAt(selectionEnd))
    var charType: CharType

    if (charTypeStart == CharType.CHARACTER || charTypeEnd == CharType.CHARACTER) {
        charType = CharType.CHARACTER
    } else if (charTypeStart == CharType.WHITESPACE || charTypeEnd == CharType.WHITESPACE) {
        charType = CharType.WHITESPACE
    } else {
        charType = CharType.PUNCTUATION_MARK
    }

    if (charTypeStart == charType) {
        while (selectionStart != 0 && getCharType(text.charAt(selectionStart - 1)) == charType) {
            selectionStart--
        }
    }
    if (charTypeEnd == charType) {
        while (selectionEnd != text.length && getCharType(text.charAt(selectionEnd)) == charType) {
            selectionEnd++
        }
    }

    return new Selection(text, selectionStart, selectionEnd)
}
