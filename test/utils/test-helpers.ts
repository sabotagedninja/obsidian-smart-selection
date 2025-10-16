import SmartSelectionDelegate from 'src/smart-selection-delegate';


/**
 * Trim lines and replace `.` with `\n` in `str`. 
 * Spaces around cursors at start and end of line are also trimmed, e.g. " | a " → "|a" and " a | " → "a|"
 * Spaces around cursors inside a line are kept as-is, e.g. " | ab ^ c | " → "|ab ^ c|"
 * 
 * Enables you to use strings in tests that are more readable. 
 * e.g. `| Line 1 ^ . Line 2 | .. Line 3` → `|Line 1^\nLine 2|\n\nLine 3`
 */
export function _(str: string): string {
  return str
        .split('.')
        .map(line => line
            .trim()
            .replace(/^([\|\^])\s+/g, '$1') // Trim "| a" → "|a" and "^ a" → "^a" (at start of line)
            .replace(/\s+([\|\^])$/g, '$1') // Trim "a |" → "a|" and "a ^" → "a^" (at end of line)
        ).join('\n');
}

type CursorIndexes = {
    anchor: number;
    head?: number;
    origin?: number;
}

/**
 * Valid cursor configurations:
 *   '|abc'     Caret (blinking cursor)
 *   '|abc|'    Selection
 *   '^abc|'    Forward selection
 *   '|abc^'    Backward selection
 *   '|ab^c|'   Selection with origin (used for shrinkSelection)
 * 
 * Invalid cursor configurations:
 *   'abc'      No cursors
 *   '^abc'     Origin cursor(s) without normal cursor(s)
 *   '|ab|c^'   Origin outside of selection
 *   '|a^b|c|'  Cursor count > 3
 * 
 * @param str 
 * @returns 
 */
export function findCursorIndexes(str: string): CursorIndexes {
    const cursorCount = (str.match(/[|^]/g) || []).length;
    if (!cursorCount) throw new Error("No cursors");
    if (cursorCount > 3) throw new Error("Too many cursors");
    if (!str.includes('|')) throw new Error("Must include at least one pipe symbol cursor");
    const oneCursor = cursorCount == 1;
    const twoCursors = cursorCount == 2;
    const threeCursors = cursorCount == 3;
    const containsCaretSymbol = str.includes('^');
    const p1idx = str.indexOf('|');     // Index of first pipe symbol
    const p2idx = str.lastIndexOf('|'); // Index of second pipe symbol
    const cidx = str.indexOf('^');      // Index of caret symbol
    const isCaret = oneCursor && p1idx >= 0;
    const isSelection = twoCursors && p1idx < p2idx;
    const isForwardSelection = twoCursors && containsCaretSymbol && cidx < p1idx;
    const isBackwardSelection = twoCursors && containsCaretSymbol && p1idx < cidx;
    const isSelectionWithOrigin = threeCursors && containsCaretSymbol && p1idx < cidx && cidx < p2idx;
    // Cursor symbols should not count themselves as character indexes!
    // Therefor, subtract 1 for each subsequent cursor found
    if (isCaret) {
        return { anchor: p1idx };
    } else if (isSelection) {
        return { anchor: p1idx, head: p2idx - 1 };
    } else if (isForwardSelection) {
        return { anchor: cidx, head: p1idx - 1 };
    } else if (isBackwardSelection) {
        return { anchor: cidx - 1, head: p1idx };
    } else if (isSelectionWithOrigin) {
        return { anchor: p1idx, head: p2idx - 2, origin: cidx - 1 };
    }
    throw new Error('Invalid cursor configuration: ' + str);
}

export function removeCursorSymbols(str: string): string {
    return str.replace(/[|^]/g, '',)
}

export function expandSelection(plugin: SmartSelectionDelegate, textWithCursors: string, numberOfTimesToExpand: number = 1): string {
    const expandFn = () => { plugin.expandSelection(); };
    return expandOrShrinkSelection(plugin, textWithCursors, numberOfTimesToExpand, expandFn);
}

export function shrinkSelection(plugin: SmartSelectionDelegate, textWithCursors: string, numberOfTimesToShrink: number = 1): string {
    const shrinkFn = () => { plugin.shrinkSelection(); };
    return expandOrShrinkSelection(plugin, textWithCursors, numberOfTimesToShrink, shrinkFn);
}

function expandOrShrinkSelection(plugin: SmartSelectionDelegate, textWithCursors: string, numberOfTimes: number = 1, expandOrShrinkFunction: Function): string {
    // TODO add some explaining comments
    const cursors = findCursorIndexes(textWithCursors);
    const text = removeCursorSymbols(textWithCursors);
    
    const editor = plugin.getEditor();
    editor.setValue(text);

    if (!cursors.head) {
        editor.setCursor(editor.offsetToPos(cursors.anchor));
    } else {
        editor.setSelection(editor.offsetToPos(cursors.anchor), editor.offsetToPos(cursors.head));
    }

    if (cursors.origin) {
        plugin['origin'] = editor.offsetToPos(cursors.origin);
    }

    while(numberOfTimes--) {
        expandOrShrinkFunction();
    }

    return editor.getSelection();
}
