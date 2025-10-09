import EditorStub from './stubs/obsidian-editor-stub';
import SmartSelectionPluginImpl from '../plugin/smart-selection-plugin-impl'
import { toPos, toRange, toSelection, posEquals, posGTE, posGT, posLTE, posLT, rangeEquals, rangeContains, rangeContainsPartial, rangeContainsPos, rangeIntersects, getIntersection, getUnion } from '../plugin/functions'
import { _, expandSelection, shrinkSelection } from './utils/test-helpers';

const TWO_TIMES = 2;
const THREE_TIMES = 3;

describe('Plugin: SelectionExpanderPluginImpl', () => {

  let plugin: SmartSelectionPluginImpl;

  beforeEach(() => {
    const editor = new EditorStub(); // Obsidian Editor stub
    plugin = new SmartSelectionPluginImpl();
    // In the actual plugin code (main.ts), `plugin` is created once and setEditor() is called on every event.
    plugin.setEditor(editor);

  });

  describe('Plugin initialization', () => {
    test('Calling setEditor(null) → throws ReferenceError ("argument cannot be null")', () => {
      expect(() => plugin.setEditor(null)).toThrow();
    });
    test('Not calling setEditor() at all → throws ReferenceError ("editor not set")', () => {
      // plugin.editor is initialized in beforeEach() and setEditor(null) throws an Error
      // Therefor, set plugin.editor to null the javascript-way, bypassing typescript (private field)
      plugin['editor'] = null;
      // Call plugin here directly, since the helper method crashes because editor is null
      expect(() => plugin.expandSelection()).toThrow();
    });
  });

  describe('Function under test: expandSelection', () => {

    describe('Scenario: Expand to line', () => {

      describe('Condition: No selection', () => {
        test('Cursor somewhere on a line → selects that line', () => {
          expect(expandSelection(plugin, _('|abc . def'))).toBe(_('abc'));
          expect(expandSelection(plugin, _('ab|c . def'))).toBe(_('abc'));
          expect(expandSelection(plugin, _('abc . def|'))).toBe(_('def'));
        });
      });
      describe('Condition: Selection on single line', () => {
        test('Partial line selected → selects that line', () => {
          expect(expandSelection(plugin, _('|ab|c . def'))).toBe(_('abc'));
          expect(expandSelection(plugin, _('abc . d|ef|'))).toBe(_('def'));
        });
        test('Forward selection (anchor=^) → selects that line', () => {
          expect(expandSelection(plugin, _('^ab|c . def'))).toBe(_('abc'));
          expect(expandSelection(plugin, _('abc . d^ef|'))).toBe(_('def'));
        });
        test('Backward selection (anchor=^) → selects that line', () => {
          expect(expandSelection(plugin, _('|ab^c . def'))).toBe(_('abc'));
          expect(expandSelection(plugin, _('abc . d|ef^'))).toBe(_('def'));
        });
      });
    });

    describe('Scenario: Expand to paragraph', () => {

      describe('Condition: No selection', () => {
        test('Cursor on empty line after paragraph → selects empty line + paragraph above cursor', () => {
          expect(expandSelection(plugin, _('abc . def .| .. ghi'))).toBe(_('abc . def .'));
        });
        test('Cursor on empty line before paragraph → selects empty line + paragraph below cursor', () => {
          expect(expandSelection(plugin, _('|. abc . def .. ghi'))).toBe(_('. abc . def'));
        });
        test('Cursor on empty line between paragraphs → selects paragraphs above and below cursor, including empty line', () => {
          expect(expandSelection(plugin, _('abc .|. def .. ghi'))).toBe(_('abc .. def'));
        });
        test('Cursor on line in paragraph → perform 2 expansions → selects line first, then paragraph', () => {
          expect(expandSelection(plugin, _('abc . def| .. ghi'), TWO_TIMES)).toBe(_('abc . def'));
        });
      });
      describe('Condition: Selection within single paragraph', () => {
        test('Line partially selected → perform 2 expansions → selects line first, then paragraph', () => {
          expect(expandSelection(plugin, _('|ab|c . def .. ghi'), TWO_TIMES)).toBe(_('abc . def'));
        });
        test('Paragraph partially selected (spans 2 lines) → selects paragraph', () => {
          expect(expandSelection(plugin, _('ab|c . de|f .. ghi'))).toBe(_('abc . def'));
        });
      });
      describe('Condition: Selection across multiple paragraphs', () => {
        test('Paragraph partially selected → selects those paragraphs', () => {
          expect(expandSelection(plugin, _('ab|c .. de|f .. ghi'))).toBe(_('abc .. def'));
          expect(expandSelection(plugin, _('a|bc .. def .... g|hi .. jkl'))).toBe(_('abc .. def .... ghi'));
        });
      });
    });

    describe('Scenario: Expand to document', () => {

      test('Empty line surrounded by empty lines → selects entire document', () => {
        expect(expandSelection(plugin, _('abc ..|.. def'))).toBe(_('abc .... def'));
        expect(expandSelection(plugin, _('abc ...|.. defghi .. jkl'))).toBe(_('abc ... .. defghi .. jkl'));
      });
      test('One fully selected paragraph → selects entire document', () => {
        expect(expandSelection(plugin, _('|abc| .. def .. ghi'))).toBe(_('abc .. def .. ghi'));
      });
      test('Two fully selected paragraphs → selects entire document', () => {
        expect(expandSelection(plugin, _('|abc .. def| .. ghi'))).toBe(_('abc .. def .. ghi'));
      });
      test('Two fully and one partially selected paragraphs → selects all three paragraphs (which is the same as the entire document here)', () => {
        expect(expandSelection(plugin, _('|abc .. def .. g|hi'))).toBe(_('abc .. def .. ghi'));
      });
    });

    describe('Scenario: Consequtive expansions', () => {
      test('One expansion → selects line', () => {
        expect(expandSelection(plugin, _('abc . def | .. ghi . jkl'))).toBe(_('def'));
      });
      test('Two expansions → selects paragraph', () => {
        expect(expandSelection(plugin, _('abc . def | .. ghi . jkl'), TWO_TIMES)).toBe(_('abc . def'));
      });
      test('Three expansions → selects document', () => {
        expect(expandSelection(plugin, _('abc . def | .. ghi . jkl'), THREE_TIMES)).toBe(_('abc . def .. ghi . jkl'));
      });
    });

  });

  describe('Function under test: shrinkSelection', () => {

    describe('Scenario: Shrink to paragraph', () => {
      test('Document fully selected → selects paragraph with origin cursor', () => {
        expect(shrinkSelection(plugin, _('| abc . de^f .. ghi . jkl |'))).toBe(_('abc . def'));
      });
      // After an expand operation, a line/paragraph/document is always fully selected.
      // However, a partial selection with the origin cursor somewhere inside is possible like this (e.g.):
      //  1) User expands twice from the origin cursor → the paragraph is selected.
      //  2) User selects text AROUND the origin cursor. The plugin is unaware of this and just waits for the next expand/shrink command.
      //     Note that the origin cursor is completely valid since it's inside the selection.
      //  3) Now, a shrink command is fired. The plugin behaves like so:
      //
      test('First paragraph fully and second paragraph partially selected → selects paragraph with origin cursor', () => {
        expect(shrinkSelection(plugin, _('| abc . de^f .. ghi |. jkl'))).toBe(_('abc . def'));
      });
      test('Both paragraphs partially selected → partially selects paragraph with origin cursor', () => {
        expect(shrinkSelection(plugin, _('ab|c . de^f .. ghi |. jkl'))).toBe(_('c . def'));
      });
    });

    describe('Scenario: Shrink to line', () => {
      test('Paragraph fully selected → selects line with origin cursor', () => {
        expect(shrinkSelection(plugin, _('| abc . de^f | .. ghi . jkl'))).toBe(_('def'));
      });
      test('Paragraph partially selected → selects full line with origin cursor', () => {
        expect(shrinkSelection(plugin, _('ab|c . de^f | .. ghi . jkl'))).toBe(_('def'));
      });
      test('Paragraph partially selected → selects partial line with origin cursor', () => {
        expect(shrinkSelection(plugin, _('abc . d|e^f .|. ghi . jkl'))).toBe(_('ef'));
      });
      test('Paragraph partially selected → selects partial line with origin cursor (2)', () => {
        expect(shrinkSelection(plugin, _('ab|c . d^e|f .. ghi . jkl'))).toBe(_('de'));
      });
    });

    describe('Scenario: Shrink to cursor', () => {
      test('Entire document is one line, fully selected → restores origin cursor (nothing selected)', () => {
        expect(shrinkSelection(plugin, _('|ab^c|'))).toBe(_(''));
        expect(plugin.getEditor().getCursor()).toStrictEqual(toPos(0, 2));
        expect(plugin.getEditor().somethingSelected()).toBeFalsy();
      });
      test('Line fully selected → restores origin cursor (nothing selected)', () => {
        expect(shrinkSelection(plugin, _('abc . | de^f | .. ghi . jkl'))).toBe(_(''));
        expect(plugin.getEditor().getCursor()).toStrictEqual(toPos(1, 2));
        expect(plugin.getEditor().somethingSelected()).toBeFalsy();
      });
      test('Line partially selected → restores origin cursor (nothing selected)', () => {
        expect(shrinkSelection(plugin, _('abc . d|e^f | .. ghi . jkl'))).toBe(_(''));
        expect(plugin.getEditor().getCursor()).toStrictEqual(toPos(1, 2));
        expect(plugin.getEditor().somethingSelected()).toBeFalsy();
      });
      test('No selection, just the cursor → nothing happens', () => {
        expect(shrinkSelection(plugin, _('abc . def | .. ghi . jkl'))).toBe(_(''));
        expect(plugin.getEditor().getCursor()).toStrictEqual(toPos(1, 3));
        expect(plugin.getEditor().somethingSelected()).toBeFalsy();
      });
    });

    describe('Scenario: Consequtive shrinkages', () => {
      test('One shrinkage → selects paragraph with origin cursor', () => {
        expect(shrinkSelection(plugin, _('| abc . de^f .. ghi . jkl |'))).toBe(_('abc . def'));
      });
      test('Two shrinkages → selects line with origin cursor', () => {
        expect(shrinkSelection(plugin, _('| abc . de^f .. ghi . jkl |'), TWO_TIMES)).toBe(_('def'));
      });
      test('Three shrinkages → restores origin cursor (nothing selected)', () => {
        expect(shrinkSelection(plugin, _('| abc . de^f .. ghi . jkl |'), THREE_TIMES)).toBe(_(''));
        expect(plugin.getEditor().getCursor()).toStrictEqual(toPos(1, 2));
        expect(plugin.getEditor().somethingSelected()).toBeFalsy();
      });
    });

  });
});

describe('Functions', () => {
  const POS_0 = toPos(0, 0);
  const POS_1 = toPos(1, 1);
  const POS_2 = toPos(2, 2);
  const POS_3 = toPos(3, 3);
  const POS_4 = toPos(4, 4);
  const POS_5 = toPos(5, 5);
  const POS_6 = toPos(6, 6);
  const POS_7 = toPos(7, 7);
  const POS_1_RESULT = { line: 1, ch: 1 };
  const POS_2_RESULT = { line: 2, ch: 2 };

  test('toPos', () => {
    expect(toPos(1, 2)).toStrictEqual({ line: 1, ch: 2 });
    expect(toPos(2, 1)).toStrictEqual({ line: 2, ch: 1 });
  });
  test('toRange', () => {
    expect(toRange(POS_1, POS_2)).toStrictEqual({ from: POS_1_RESULT, to: POS_2_RESULT});
    expect(toRange(POS_2, POS_1)).toStrictEqual({ from: POS_2_RESULT, to: POS_1_RESULT});
  });
  test('toSelection', () => {
    expect(toSelection(POS_1, POS_2)).toStrictEqual({ anchor: POS_1_RESULT, head: POS_2_RESULT });
    expect(toSelection(toRange(POS_1, POS_2))).toStrictEqual({ anchor: POS_1_RESULT, head: POS_2_RESULT });
  });
  test('posEquals', () => {
    expect(posEquals(POS_1, POS_1)).toBeTruthy();
    expect(posEquals(POS_1, POS_2)).toBeFalsy();
  });
  test('posGTE', () => {
    expect(posGTE(POS_2, POS_1)).toBeTruthy();
    expect(posGTE(POS_1, POS_1)).toBeTruthy();
    expect(posGTE(POS_1, POS_2)).toBeFalsy();
  });
  test('posGT', () => {
    expect(posGT(POS_2, POS_1)).toBeTruthy();
    expect(posGT(POS_1, POS_1)).toBeFalsy();
    expect(posGT(POS_1, POS_2)).toBeFalsy();
  });
  test('posLTE', () => {
    expect(posLTE(POS_1, POS_2)).toBeTruthy();
    expect(posLTE(POS_1, POS_1)).toBeTruthy();
    expect(posLTE(POS_2, POS_1)).toBeFalsy();
  });
  test('posLT', () => {
    expect(posLT(POS_1, POS_2)).toBeTruthy();
    expect(posLT(POS_1, POS_1)).toBeFalsy();
    expect(posLT(POS_2, POS_1)).toBeFalsy();
  });
  describe('rangeEquals', () => {
    test('cursor equals cursor (not really a range, but still works)', () => {
      expect(rangeEquals(toRange(POS_1, POS_1), toRange(POS_1, POS_1))).toBeTruthy();
    });
    test('range equals range', () => {
      expect(rangeEquals(toRange(POS_1, POS_2), toRange(POS_1, POS_2))).toBeTruthy();
      expect(rangeEquals(toRange(POS_1, POS_2), toRange(POS_2, POS_1))).toBeFalsy();
    });
  });
  describe('rangeContains (range A contains range B - fully or partial)', () => {
    const range = toRange(POS_1, POS_4);
    test('A equal to B → true', () => {
      expect(rangeContains(range, range)).toBeTruthy();
    });
    test('B inside of A → true', () => {
      expect(rangeContains(range, toRange(POS_2, POS_3))).toBeTruthy();
    });
    test('B inside and outside of A → false', () => {
      expect(rangeContains(range, toRange(POS_0, POS_4))).toBeFalsy();
    });
  });
  describe('rangeContainsPartial (range A contains range B - exclusively partial, not fully)', () => {
    const range = toRange(POS_1, POS_4);
    test('A equal to B → false', () => {
      expect(rangeContainsPartial(range, range)).toBeFalsy();
    });
    test('B (partially) inside of A (not fully) → true', () => {
      expect(rangeContainsPartial(range, toRange(POS_1, POS_3))).toBeTruthy();
      expect(rangeContainsPartial(range, toRange(POS_2, POS_3))).toBeTruthy();
      expect(rangeContainsPartial(range, toRange(POS_2, POS_4))).toBeTruthy();
      expect(rangeContainsPartial(range, toRange(POS_1, POS_4))).toBeFalsy(); // Fully, i.e. B equal to A
    });
    test('B (partially) inside and outside of A → false', () => {
      expect(rangeContainsPartial(range, toRange(POS_0, POS_3))).toBeFalsy();
    });
  });
  test('rangeContainsPos', () => {
    const range = toRange(POS_1, POS_3);
    expect(rangeContainsPos(range, POS_1)).toBeTruthy();
    expect(rangeContainsPos(range, POS_2)).toBeTruthy();
    expect(rangeContainsPos(range, POS_3)).toBeTruthy();
    expect(rangeContainsPos(range, POS_0)).toBeFalsy();
    expect(rangeContainsPos(range, POS_4)).toBeFalsy();
  });
  describe('rangeIntersects (range A intersects with range B)', () => {
    const cursor = toRange(POS_3, POS_3);
    const range = toRange(POS_2, POS_5);
    test('Both cursors (not a range) → false', () => {
      expect(rangeIntersects(cursor, cursor)).toBeFalsy();
    });
    test('Range A contains cursor B → true', () => {
      expect(rangeIntersects(range, cursor)).toBeTruthy();
    });
    test('A equal to B (reflexive) → true', () => {
      expect(rangeIntersects(range, range)).toBeTruthy();
    });
    test('B partially inside of A → true', () => {
      expect(rangeIntersects(range, toRange(POS_2, POS_4))).toBeTruthy();
      expect(rangeIntersects(range, toRange(POS_3, POS_4))).toBeTruthy();
      expect(rangeIntersects(range, toRange(POS_3, POS_5))).toBeTruthy();
    });
    test('B inside and outside of A → true', () => {
      expect(rangeIntersects(range, toRange(POS_1, POS_3))).toBeTruthy(); // B wraps around A.from
      expect(rangeIntersects(range, toRange(POS_4, POS_6))).toBeTruthy(); // B wraps around A.to
    });
    test('B fully outside of A → false', () => {
      expect(rangeIntersects(range, toRange(POS_0, POS_1))).toBeFalsy();
      expect(rangeIntersects(range, toRange(POS_6, POS_7))).toBeFalsy();
    });
    test('B adjacent to A (boundary test) → false', () => {
      expect(rangeIntersects(range, toRange(POS_1, POS_2))).toBeFalsy();
      expect(rangeIntersects(range, toRange(POS_5, POS_6))).toBeFalsy();
    });
    test('B overlaps A and A overlaps B (symmetric) → true', () => {
      expect(rangeIntersects(toRange(POS_1, POS_3), toRange(POS_2, POS_4))).toBeTruthy();
      expect(rangeIntersects(toRange(POS_2, POS_4), toRange(POS_1, POS_3))).toBeTruthy();
    });
  });
  describe('getIntersection (intersection of range A with range B)', () => {
    const cursor = toRange(POS_3, POS_3);
    const range = toRange(POS_2, POS_5);
    test('Both cursors (not a range) → null', () => {
      expect(getIntersection(cursor, cursor)).toBeNull();
    });
    test('Range A contains cursor B → null', () => {
      expect(getIntersection(range, cursor)).toBeNull();
    });
    test('A equal to B (reflexive)', () => {
      expect(getIntersection(range, range)).toStrictEqual(range);
    });
    test('B partially inside of A', () => {
      expect(getIntersection(range, toRange(POS_2, POS_4))).toStrictEqual(toRange(POS_2, POS_4));
      expect(getIntersection(range, toRange(POS_3, POS_4))).toStrictEqual(toRange(POS_3, POS_4));
      expect(getIntersection(range, toRange(POS_3, POS_5))).toStrictEqual(toRange(POS_3, POS_5));
    });
    test('B inside and outside of A', () => {
      expect(getIntersection(range, toRange(POS_1, POS_3))).toStrictEqual(toRange(POS_2, POS_3)); // B wraps around A.from
      expect(getIntersection(range, toRange(POS_4, POS_6))).toStrictEqual(toRange(POS_4, POS_5)); // B wraps around A.to
    });
    test('B fully outside of A → null', () => {
      expect(getIntersection(range, toRange(POS_0, POS_1))).toBeNull();
      expect(getIntersection(range, toRange(POS_6, POS_7))).toBeNull();
    });
    test('B adjacent to A (boundary test) → null', () => {
      expect(getIntersection(range, toRange(POS_1, POS_2))).toBeNull();
      expect(getIntersection(range, toRange(POS_5, POS_6))).toBeNull();
    });
    test('B overlaps A and A overlaps B (symmetric)', () => {
      expect(getIntersection(toRange(POS_1, POS_3), toRange(POS_2, POS_4))).toStrictEqual(toRange(POS_2, POS_3));
      expect(getIntersection(toRange(POS_2, POS_4), toRange(POS_1, POS_3))).toStrictEqual(toRange(POS_2, POS_3));
    });
  });
  describe('getUnion (union of range A with range B)', () => {
    const cursor = toRange(POS_3, POS_3);
    const range = toRange(POS_2, POS_5);
    test('Both cursors (not a range) → cursor', () => {
      expect(getUnion(cursor, cursor)).toStrictEqual(cursor);
    });
    test('Range A contains cursor B → range A', () => {
      expect(getUnion(range, cursor)).toStrictEqual(range);
    });
    test('A equal to B (reflexive) → range A', () => {
      expect(getUnion(range, range)).toStrictEqual(range);
    });
    test('B partially inside of A', () => {
      expect(getUnion(range, toRange(POS_2, POS_4))).toStrictEqual(toRange(POS_2, POS_5));
      expect(getUnion(range, toRange(POS_3, POS_4))).toStrictEqual(toRange(POS_2, POS_5));
      expect(getUnion(range, toRange(POS_3, POS_5))).toStrictEqual(toRange(POS_2, POS_5));
    });
    test('B inside and outside of A', () => {
      expect(getUnion(range, toRange(POS_1, POS_3))).toStrictEqual(toRange(POS_1, POS_5)); // B wraps around A.from
      expect(getUnion(range, toRange(POS_4, POS_6))).toStrictEqual(toRange(POS_2, POS_6)); // B wraps around A.to
    });
    test('B fully outside of A → null', () => {
      expect(getUnion(range, toRange(POS_0, POS_1))).toStrictEqual(toRange(POS_0, POS_5));
      expect(getUnion(range, toRange(POS_6, POS_7))).toStrictEqual(toRange(POS_2, POS_7));
    });
    test('B adjacent to A (boundary test) → null', () => {
      expect(getUnion(range, toRange(POS_1, POS_2))).toStrictEqual(toRange(POS_1, POS_5));
      expect(getUnion(range, toRange(POS_5, POS_6))).toStrictEqual(toRange(POS_2, POS_6));
    });
    test('B overlaps A and A overlaps B (symmetric)', () => {
      expect(getUnion(toRange(POS_1, POS_3), toRange(POS_2, POS_4))).toStrictEqual(toRange(POS_1, POS_4));
      expect(getUnion(toRange(POS_2, POS_4), toRange(POS_1, POS_3))).toStrictEqual(toRange(POS_1, POS_4));
    });
  });

});
