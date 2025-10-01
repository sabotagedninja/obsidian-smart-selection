import SelectionExpanderPluginImpl from 'src/plugin/selection-expander-plugin-impl';
import { Editor } from 'src/__mocks__/obsidian';

type CaretIndexes = {
    anchor: number;
    head?: number;
}

// Valid caret configurations: '|abc', '|abc|', '^abc|', '|abc^'
// Invalid caret configurations: 'abc', '^abc', '^abc^'
export function findCaretIndexes(str: string): CaretIndexes {
    if (str.includes('|')) {
        const containsOnlyOnePipeCaret = str.indexOf('|') === str.lastIndexOf('|') && !str.includes('^');
        const containsOnlyTwoPipeCarets = str.indexOf('|') < str.lastIndexOf('|') && !str.includes('^');
        const containsAnchorBeforeHead = str.indexOf('^') < str.lastIndexOf('|');
        const containsHeadBeforeAnchor = str.indexOf('|') < str.lastIndexOf('^');
        // Caret symbols should not count themselves as character indexes!
        // Therefor, subtract 1 from the second caret's index.
        if (containsOnlyOnePipeCaret) {
            return {anchor: str.indexOf('|')};
        } else if (containsOnlyTwoPipeCarets) {
            return {anchor: str.indexOf('|'), head: str.lastIndexOf('|') - 1};
        } else if (containsAnchorBeforeHead) {
            return {anchor: str.indexOf('^'), head: str.indexOf('|') - 1};
        } else if (containsHeadBeforeAnchor) {
            return {anchor: str.indexOf('^') - 1, head: str.indexOf('|')};
        }
    }
    throw new Error('Invalid caret configuration');
}

export function removeCarets(str: string): string {
    return str.replace(/[\|\^]/g, '',)
}

export function expand(plugin: SelectionExpanderPluginImpl, editor: Editor, textWithCarets: string, numberOfTimesToExpand: number = 1) {
    var text = removeCarets(textWithCarets);
    var carets = findCaretIndexes(textWithCarets);
    editor.setValue(text);

    if (!carets.head) {
        editor.setCursor(editor.offsetToPos(carets.anchor));
    } else {
        console.log('test-helper: editor.setSelection(): ', JSON.stringify(carets));
        editor.setSelection(editor.offsetToPos(carets.anchor), editor.offsetToPos(carets.head));
    }

    while(numberOfTimesToExpand--) {
        plugin.expandSelectionCycle();
        plugin.setEditor(editor); // Bypass normal invalidation flow...
    }

    return editor.getSelection();
}
