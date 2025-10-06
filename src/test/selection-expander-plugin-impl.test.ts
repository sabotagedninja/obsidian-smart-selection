import EditorStub from './stubs/obsidian-editor-stub';
import SelectionExpanderPluginImpl, { getIntersection, getUnion, posEquals, posGT, posGTE, posLT, posLTE, rangeContains, rangeContainsPos, rangeEquals, rangeIntersects, toPos, toRange, toSelection } from '../plugin/selection-expander-plugin-impl'
import { _, expandSelection, shrinkSelection } from './utils/test-helpers';


const TWO_TIMES = 2;
const THREE_TIMES = 3;

describe('Plugin: SelectionExpanderPluginImpl', () => {

  let plugin: SelectionExpanderPluginImpl;

  beforeEach(() => {
    const editor = new EditorStub(); // Obsidian Editor stub
    plugin = new SelectionExpanderPluginImpl();
    plugin.setEditor(editor);

  });

  describe('Scenario: Expand selection', () => { // TODO Write better srings in test() - add expected result

    describe('Scenario: Expand to line', () => {
      describe('Condition: No selection', () => {
        test('Cursor somewhere on a line', () => {
          expect(expandSelection(plugin, _('|abc . def'))).toBe(_('abc'));
          expect(expandSelection(plugin, _('ab|c . def'))).toBe(_('abc'));
          expect(expandSelection(plugin, _('abc . def|'))).toBe(_('def'));
        });
      });
      describe('Condition: Selection on single line', () => {
        test('Selection range', () => {
          expect(expandSelection(plugin, _('|ab|c . def'))).toBe(_('abc'));
        });
        test('Forward selection (anchor=^)', () => {
          expect(expandSelection(plugin, _('a^bc| . def'))).toBe(_('abc'));
        });
        test('Backward selection (anchor=^)', () => {
          expect(expandSelection(plugin, _('abc . |de^f'))).toBe(_('def'));
        });
      });
    });

    describe('Scenario: Expand to paragraph', () => {
      describe('Condition: No selection', () => {
        test('Cursor on empty line after paragraph → selects paragraph above cursor', () => {
          expect(expandSelection(plugin, _('abc . def .| .. ghi'))).toBe(_('abc . def .'));
        });
        test('Cursor on empty line before paragraph → selects paragraph below cursor', () => {
          expect(expandSelection(plugin, _('|. abc . def .. ghi'))).toBe(_('. abc . def'));
        });
        test('Cursor on empty line between paragraphs → selects both paragraphs', () => {
          expect(expandSelection(plugin, _('abc .|. def .. ghi'))).toBe(_('abc .. def'));
        });
        test('Cursor on line in paragraph → selects line first, then paragraph (perform 2 expansions)', () => {
          expect(expandSelection(plugin, _('abc . def| .. ghi'), TWO_TIMES)).toBe(_('abc . def'));
        });
      });
      describe('Condition: Selection within single paragraph', () => {
        test('Partially selected line → selects line first, then paragraph (perform 2 expansions)', () => {
          expect(expandSelection(plugin, _('|ab|c . def .. ghi'), TWO_TIMES)).toBe(_('abc . def'));
        });
        test('Partially selected paragraph (spans 2 lines) → selects paragraph', () => {
          expect(expandSelection(plugin, _('ab|c . de|f .. ghi'))).toBe(_('abc . def'));
        });
      });
      describe('Condition: Selection across multiple paragraphs', () => {
        test('Partially selected paragraphs → selects those paragraphs', () => {
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

  describe('Scenario: Shrink selection', () => {

    describe('Scenario: Shrink to paragraph', () => {
      test('Document fully selected → selects paragraph with origin cursor', () => {
        expect(shrinkSelection(plugin, _('| abc . de^f .. ghi . jkl |'))).toBe(_('abc . def'));
      });
      // Hmm... This never happens!
      // The origin cursor can only be different than the anchor cursor when an expansion occurred directly before a shrink. 
      // This also means that a paragraph is ALWAYS fully selected.
      // 
      // A shrink from a partial selection IS possible (user selection), but the ---
      //
      // NO WAIT !! THIS CAN HAPPEN:
      //
      // 1) User expands twice from the origin cursor → the paragraph is selected.
      // 2) User selects text AROUND the origin cursor. The plugin is unaware of this and just waits for the next expand/shrink command.
      //    - Note that the origin cursor is still valid at this point, from the perspective of the plugin.
      // 3) Now, a shrink command is fired. What should the plugin do? Exactly that what these tests are describing...
      //
      test('First paragraph fully and second paragraph partially selected → selects paragraph with origin cursor', () => {
        expect(shrinkSelection(plugin, _('| abc . de^f .. ghi .| jkl'))).toBe(_('abc . def'));
      });
      test('Both paragraphs partially selected → partially selects first paragraph with origin cursor', () => {
        expect(shrinkSelection(plugin, _('ab|c . de^f .. ghi .| jkl'))).toBe(_('c . def'));
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
    });

    describe('Scenario: Consequtive expansions', () => {
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
  test('rangeEquals', () => {
    expect(rangeEquals(toRange(POS_1, POS_1), toRange(POS_1, POS_1))).toBeTruthy(); // Cursor
    expect(rangeEquals(toRange(POS_1, POS_2), toRange(POS_1, POS_2))).toBeTruthy(); // Selection
    expect(rangeEquals(toRange(POS_1, POS_2), toRange(POS_2, POS_1))).toBeFalsy();
  });
  test('rangeContains', () => {
    const range = toRange(POS_1, POS_4);
    expect(rangeContains(range, range)).toBeTruthy(); // A equal to B
    expect(rangeContains(range, toRange(POS_2, POS_3))).toBeTruthy(); // B inside of A
    expect(rangeContains(range, toRange(POS_0, POS_4))).toBeFalsy(); // B inside and outside of A
  });
  test('rangeContainsPos', () => {
    const range = toRange(POS_1, POS_3);
    expect(rangeContainsPos(range, POS_1)).toBeTruthy();
    expect(rangeContainsPos(range, POS_2)).toBeTruthy();
    expect(rangeContainsPos(range, POS_3)).toBeTruthy();
    expect(rangeContainsPos(range, POS_0)).toBeFalsy();
    expect(rangeContainsPos(range, POS_4)).toBeFalsy();
  });
  test('rangeIntersects', () => { // TODO split this into description with multiple tests
    const cursor = toRange(POS_3, POS_3);
    const range = toRange(POS_2, POS_5);
    expect(rangeIntersects(cursor, cursor)).toBeFalsy(); // Both cursors (not a range)
    expect(rangeIntersects(range, cursor)).toBeTruthy(); // Range A contains cursor B
    expect(rangeIntersects(range, range)).toBeTruthy(); // A equal to B | B fully inside of A
    expect(rangeIntersects(range, toRange(POS_2, POS_4))).toBeTruthy(); // A equal to B (boundary test)
    expect(rangeIntersects(range, toRange(POS_3, POS_5))).toBeTruthy(); // A equal to B (boundary test) (2)
    expect(rangeIntersects(range, toRange(POS_3, POS_4))).toBeTruthy(); // B inside of A
    expect(rangeIntersects(range, toRange(POS_1, POS_3))).toBeTruthy(); // B inside and outside of A
    expect(rangeIntersects(range, toRange(POS_4, POS_6))).toBeTruthy(); // B inside and outside of A (2)
    expect(rangeIntersects(range, toRange(POS_0, POS_1))).toBeFalsy(); // B fully outside of A
    expect(rangeIntersects(range, toRange(POS_6, POS_7))).toBeFalsy(); // B fully outside of A (2)
    expect(rangeIntersects(range, toRange(POS_1, POS_2))).toBeFalsy(); // B adjacent to A (boundary test)
    expect(rangeIntersects(range, toRange(POS_5, POS_6))).toBeFalsy(); // B adjacent to A (boundary test) (2)
    expect(rangeIntersects(toRange(POS_1, POS_3), toRange(POS_2, POS_4))).toBeTruthy(); // B overlaps A ...
    expect(rangeIntersects(toRange(POS_2, POS_4), toRange(POS_1, POS_3))).toBeTruthy(); // ... and A overlaps B
  });
  test('getIntersection', () => { // TODO split this into description with multiple tests
    const cursor = toRange(POS_3, POS_3);
    const range = toRange(POS_2, POS_5);
    expect(getIntersection(cursor, cursor)).toBeNull(); // Cursor
    expect(getIntersection(range, cursor)).toBeNull(); // Cursor (2)
    expect(getIntersection(range, range)).toStrictEqual(range); // A equal to B | B fully inside of A
    expect(getIntersection(range, toRange(POS_2, POS_4))).toStrictEqual(toRange(POS_2, POS_4)); // A equal to B (boundary test)
    expect(getIntersection(range, toRange(POS_3, POS_5))).toStrictEqual(toRange(POS_3, POS_5)); // A equal to B (boundary test) (2)
    expect(getIntersection(range, toRange(POS_3, POS_4))).toStrictEqual(toRange(POS_3, POS_4)); // B inside of A
    expect(getIntersection(range, toRange(POS_1, POS_3))).toStrictEqual(toRange(POS_2, POS_3)); // B inside and outside of A
    expect(getIntersection(range, toRange(POS_4, POS_6))).toStrictEqual(toRange(POS_4, POS_5)); // B inside and outside of A (2)
    expect(getIntersection(range, toRange(POS_0, POS_1))).toBeNull(); // B fully outside of A
    expect(getIntersection(range, toRange(POS_6, POS_7))).toBeNull(); // B fully outside of A (2)
    expect(getIntersection(range, toRange(POS_1, POS_2))).toBeNull(); // B adjacent to A (boundary test)
    expect(getIntersection(range, toRange(POS_5, POS_6))).toBeNull(); // B adjacent to A (boundary test) (2)
    expect(getIntersection(toRange(POS_1, POS_3), toRange(POS_2, POS_4))).toStrictEqual(toRange(POS_2, POS_3)); // B overlaps A ...
    expect(getIntersection(toRange(POS_2, POS_4), toRange(POS_1, POS_3))).toStrictEqual(toRange(POS_2, POS_3)); // ... and A overlaps B
  });
  test('getUnion', () => { // TODO split this into description with multiple tests
    const cursor = toRange(POS_3, POS_3);
    const range = toRange(POS_2, POS_5);
    expect(getUnion(cursor, cursor)).toStrictEqual(cursor); // Cursor
    expect(getUnion(range, cursor)).toStrictEqual(range); // Cursor (2)
    expect(getUnion(range, range)).toStrictEqual(range); // A equal to B | B fully inside of A
    expect(getUnion(range, toRange(POS_2, POS_4))).toStrictEqual(toRange(POS_2, POS_5)); // A equal to B (boundary test)
    expect(getUnion(range, toRange(POS_3, POS_5))).toStrictEqual(toRange(POS_2, POS_5)); // A equal to B (boundary test) (2)
    expect(getUnion(range, toRange(POS_3, POS_4))).toStrictEqual(toRange(POS_2, POS_5)); // B inside of A
    expect(getUnion(range, toRange(POS_1, POS_3))).toStrictEqual(toRange(POS_1, POS_5)); // B inside and outside of A
    expect(getUnion(range, toRange(POS_4, POS_6))).toStrictEqual(toRange(POS_2, POS_6)); // B inside and outside of A (2)
    expect(getUnion(range, toRange(POS_0, POS_1))).toStrictEqual(toRange(POS_0, POS_5)); // B fully outside of A
    expect(getUnion(range, toRange(POS_6, POS_7))).toStrictEqual(toRange(POS_2, POS_7)); // B fully outside of A (2)
    expect(getUnion(range, toRange(POS_1, POS_2))).toStrictEqual(toRange(POS_1, POS_5)); // B adjacent to A (boundary test)
    expect(getUnion(range, toRange(POS_5, POS_6))).toStrictEqual(toRange(POS_2, POS_6)); // B adjacent to A (boundary test) (2)
    expect(getUnion(toRange(POS_1, POS_3), toRange(POS_2, POS_4))).toStrictEqual(toRange(POS_1, POS_4)); // B overlaps A ...
    expect(getUnion(toRange(POS_2, POS_4), toRange(POS_1, POS_3))).toStrictEqual(toRange(POS_1, POS_4)); // ... and A overlaps B
  });

});
