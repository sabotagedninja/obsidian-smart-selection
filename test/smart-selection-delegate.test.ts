import { Editor} from 'obsidian';
import EditorStub from './stubs/obsidian-editor-stub';
import SmartSelectionDelegate from '../src/smart-selection-delegate'
import { toPos } from '../src/functions'
import { _, expandSelection, shrinkSelection } from './utils/test-helpers';

const TWO_TIMES = 2;
const THREE_TIMES = 3;
const FOUR_TIMES = 4;

describe('Plugin: SelectionExpanderPluginImpl', () => {

  let plugin: SmartSelectionDelegate;
  let editor: Editor;

  beforeEach(() => {
    editor = new EditorStub(); // Obsidian Editor stub
    plugin = new SmartSelectionDelegate();
    // In the actual plugin code (main.ts), `plugin` is created once and setEditor() is called on every command event.
    plugin.setEditor(editor);
  });

  describe('Plugin initialization', () => {
    test('Not calling setEditor() at all → throws ReferenceError ("editor not set")', () => {
      // Plugin is initialized in beforeEach() where the editor is also set.
      // Therefor, create a new instance and don't set editor (for this test only).
      plugin = new SmartSelectionDelegate();
      // Call plugin here directly, since the helper method crashes because editor is null
      expect(() => plugin.expandSelection()).toThrow();
    });
  });

  // This mimics how the user can select text in the (real) editor
  describe('Selection types', () => {
    test('Normal selection → expand → shrink → cursor at {0,0}', () => {
      expect(expandSelection(plugin, _('|Li|ne 1'))).toBe(_('Line'));
      plugin.shrinkSelection();
      expect(editor.getCursor()).toStrictEqual(toPos(0, 0));
    });
    test('Forward selection (anchor=^) → expand → shrink → cursor at {0,0}', () => {
      expect(expandSelection(plugin, _('^Li|ne 1'))).toBe(_('Line'));
      plugin.shrinkSelection();
      expect(editor.getCursor()).toStrictEqual(toPos(0, 0));
    });
    test('Backward selection (anchor=^) → expand → shrink → cursor (origin) at {0,2}', () => {
      expect(expandSelection(plugin, _('|Li^ne 1'))).toBe(_('Line'));
      plugin.shrinkSelection();
      expect(editor.getCursor()).toStrictEqual(toPos(0, 2));
    });
  });

  describe('Function under test: expandSelection', () => {

    describe('Scenario: Expand to word', () => {

      describe('Condition: No selection', () => {
        test('Cursor on a word → selects that word', () => {
          expect(expandSelection(plugin, _('|Line 1: @#$%& da-sh'))).toBe(_('Line'));
          expect(expandSelection(plugin, _('Line 1|: @#$%& da-sh'))).toBe(_('1'));
          expect(expandSelection(plugin, _('Line 1: @#$%& |da-sh'))).toBe(_('da'));
          expect(expandSelection(plugin, _('Line 1: @#$%& da-|sh'))).toBe(_('sh'));
          expect(expandSelection(plugin, _('Line 1: @#$%& under|_score'))).toBe(_('under_score'));
          expect(expandSelection(plugin, _('Line 1: @#$%& under_score|'))).toBe(_('under_score'));
          // See also first test in next scenario
        });
      });
      describe('Condition: Partial word selected', () => {
        test('Partial word selected → selects that word', () => {
          expect(expandSelection(plugin, _('|Li|ne 1 . Line 1'))).toBe(_('Line'));
        });
      });
    });

    describe('Scenario: Expand to line', () => {
      
      describe('Condition: No selection', () => {
        test('Cursor on a non-word → selects that line', () => {
          expect(expandSelection(plugin, _('Line 1,| @#$%& da-sh'))).toBe(_('Line 1, @#$%& da-sh'));
          expect(expandSelection(plugin, _('Line 1, |@#$%& da-sh'))).toBe(_('Line 1, @#$%& da-sh'));
          expect(expandSelection(plugin, _('Line 1, @#$|%& da-sh'))).toBe(_('Line 1, @#$%& da-sh'));
          expect(expandSelection(plugin, _('Line 1, @#$%&| da-sh'))).toBe(_('Line 1, @#$%& da-sh'));
        });
      });
      describe('Condition: Selection on single line', () => {
        test('Partial line selected (entire word) → selects that line', () => {
          expect(expandSelection(plugin, _('|Line| 1 . Line 2'))).toBe(_('Line 1'));
        });
      });
    });

    describe('Scenario: Expand to paragraph', () => {

      describe('Condition: No selection', () => {
        test('Cursor on empty line after paragraph → selects empty line + paragraph above cursor', () => {
          expect(expandSelection(plugin, _('Line 1 . Line 2 .| .. Line 3'))).toBe(_('Line 1 . Line 2 .'));
        });
        test('Cursor on empty line before paragraph → selects empty line + paragraph below cursor', () => {
          expect(expandSelection(plugin, _('|. Line 1 . Line 2 .. Line 3'))).toBe(_('. Line 1 . Line 2'));
        });
        test('Cursor on empty line between paragraphs → selects paragraphs above and below cursor, including empty line', () => {
          expect(expandSelection(plugin, _('Line 1 .|. Line 2 .. Line 3'))).toBe(_('Line 1 .. Line 2'));
        });
        test('Cursor on line in paragraph → perform 3 expansions → selects word, line, paragraph', () => {
          expect(expandSelection(plugin, _('Line 1 . Line 2| .. Line 3'), THREE_TIMES)).toBe(_('Line 1 . Line 2'));
        });
      });
      describe('Condition: Selection within single paragraph', () => {
        test('Line partially selected → perform 2 expansions → selects line, paragraph', () => {
          expect(expandSelection(plugin, _('|Line| 1 . Line 2 .. Line 3'), TWO_TIMES)).toBe(_('Line 1 . Line 2'));
        });
        test('Paragraph partially selected (spans 2 lines) → selects paragraph', () => {
          expect(expandSelection(plugin, _('Li|ne 1 . Line| 2 .. Line 3'))).toBe(_('Line 1 . Line 2'));
        });
      });
      describe('Condition: Selection across multiple paragraphs', () => {
        test('Paragraph partially selected → selects those paragraphs', () => {
          expect(expandSelection(plugin, _('Li|ne 1 .. Line| 2 .. Line 3'))).toBe(_('Line 1 .. Line 2'));
          expect(expandSelection(plugin, _('Li|ne 1 .. Line 2 .... Li|ne 3 .. Line 4'))).toBe(_('Line 1 .. Line 2 .... Line 3'));
        });
      });
    });

    describe('Scenario: Expand to document', () => {

      describe('Condition: No selection', () => {
        test('Empty line surrounded by empty lines → selects entire document', () => {
          expect(expandSelection(plugin, _('Line 1 ..|.. Line 2'))).toBe(_('Line 1 .... Line 2'));
        });
      });
      describe('Condition: something selected', () => {
        test('One fully selected paragraph → selects entire document', () => {
          expect(expandSelection(plugin, _('|Line 1| .. Line 2 .. Line 3'))).toBe(_('Line 1 .. Line 2 .. Line 3'));
        });
        test('Two fully selected paragraphs → selects entire document', () => {
          expect(expandSelection(plugin, _('|Line 1 .. Line 2| .. Line 3'))).toBe(_('Line 1 .. Line 2 .. Line 3'));
        });
        test('Two fully and one partially selected paragraphs → selects all three paragraphs (which is the same as the entire document here)', () => {
          expect(expandSelection(plugin, _('|Line 1 .. Line 2 .. Li|ne 3'))).toBe(_('Line 1 .. Line 2 .. Line 3'));
        });
      });
    });

    describe('Scenario: Consequtive expansions', () => {
      test('One expansion → selects word', () => {
        expect(expandSelection(plugin, _('Line 1 . Line 2| .. Line 3 . Line 4'))).toBe(_('2'));
      });
      test('One expansion → selects line', () => {
        expect(expandSelection(plugin, _('Line 1 . Line 2| .. Line 3 . Line 4'), TWO_TIMES)).toBe(_('Line 2'));
      });
      test('Two expansions → selects paragraph', () => {
        expect(expandSelection(plugin, _('Line 1 . Line 2| .. Line 3 . Line 4'), THREE_TIMES)).toBe(_('Line 1 . Line 2'));
      });
      test('Three expansions → selects document', () => {
        expect(expandSelection(plugin, _('Line 1 . Line 2| .. Line 3 . Line 4'), FOUR_TIMES)).toBe(_('Line 1 . Line 2 .. Line 3 . Line 4'));
      });
    });

  });

  describe('Function under test: shrinkSelection', () => {

    describe('Scenario: Shrink to paragraph', () => {
      test('Document fully selected → selects paragraph with origin cursor', () => {
        expect(shrinkSelection(plugin, _('| Line 1 . Line^ 2 .. Line 3 . Line 4 |'))).toBe(_('Line 1 . Line 2'));
      });
      // After an expand operation, a line/paragraph/document is always fully selected.
      // However, a partial selection with the origin cursor somewhere inside is possible like this (e.g.):
      //  1) User expands twice from the origin cursor → the paragraph is selected.
      //  2) User selects text AROUND the origin cursor. The plugin is unaware of this and just waits for the next expand/shrink command.
      //     Note that the origin cursor is completely valid since it's inside the selection.
      //  3) Now, a shrink command is fired. The plugin behaves like this:
      test('First paragraph fully and second paragraph partially selected → selects paragraph with origin cursor', () => {
        expect(shrinkSelection(plugin, _('| Line 1 . Line^ 2 .. Line 3 |. Line 4'))).toBe(_('Line 1 . Line 2'));
      });
      test('Both paragraphs partially selected → partially selects paragraph with origin cursor', () => {
        expect(shrinkSelection(plugin, _('Line |2 . Line^ 2 .. Line 3 |. Line 4'))).toBe(_('2 . Line 2'));
      });
    });

    describe('Scenario: Shrink to line', () => {
      test('Paragraph fully selected → selects line with origin cursor', () => {
        expect(shrinkSelection(plugin, _('| Line 1 . Line^ 2 | .. Line 3 . Line 4'))).toBe(_('Line 2'));
      });
      test('Paragraph partially selected → selects line with origin cursor', () => {
        expect(shrinkSelection(plugin, _('Line| 1 . Line^ 2 | .. Line 3 . Line 4'))).toBe(_('Line 2'));
      });
      test('Paragraph partially selected → selects partial line with origin cursor', () => {
        expect(shrinkSelection(plugin, _('Line 1 . Li|ne^ 2 .|. Line 3 . Line 4'))).toBe(_('ne 2'));
      });
      test('Paragraph partially selected → selects partial line with origin cursor (2)', () => {
        expect(shrinkSelection(plugin, _('Line| 1 . ^Li|ne 2 .. Line 3 . Line 4'))).toBe(_('Li'));
      });
    });

    describe('Scenario: Shrink to word', () => {
      test('Entire document is one line, fully selected → selects word', () => {
        expect(shrinkSelection(plugin, _('| Li^ne 1 |'))).toBe(_('Line'));
      });
      test('Line fully selected → selects word', () => {
        expect(shrinkSelection(plugin, _('Line 1 . | Li^ne 2 | .. Line 3 . Line 4'))).toBe(_('Line'));
      });
      test('Line partially selected → selects word', () => {
        expect(shrinkSelection(plugin, _('Line 1 . Li|ne^ 2 | .. Line 3 . Line 4'))).toBe(_('ne'));
      });
    });

    describe('Scenario: Shrink to cursor', () => {
      test('Entire document is one word, fully selected → restores origin cursor (nothing selected)', () => {
        expect(shrinkSelection(plugin, _('| Li^ne |'))).toBe(_(''));
        expect(editor.getCursor()).toStrictEqual(toPos(0, 2));
        expect(editor.somethingSelected()).toBeFalsy();
      });
      test('Word fully selected → restores origin cursor (nothing selected)', () => {
        expect(shrinkSelection(plugin, _('Line 1 . | Li^ne| 2  .. Line 3 . Line 4'))).toBe(_(''));
        expect(editor.getCursor()).toStrictEqual(toPos(1, 2));
        expect(editor.somethingSelected()).toBeFalsy();
      });
      test('Word partially selected → restores origin cursor (nothing selected)', () => {
        expect(shrinkSelection(plugin, _('Line 1 . Li|ne^| 2 .. Line 3 . Line 4'))).toBe(_(''));
        expect(editor.getCursor()).toStrictEqual(toPos(1, 4));
        expect(editor.somethingSelected()).toBeFalsy();
      });
      test('No selection, just the cursor → nothing happens', () => {
        expect(shrinkSelection(plugin, _('Line 1 . Line 2 | .. Line 3 . Line 4'))).toBe(_(''));
        expect(editor.getCursor()).toStrictEqual(toPos(1, 6));
        expect(editor.somethingSelected()).toBeFalsy();
      });
    });

    describe('Scenario: Consequtive shrinkages', () => {
      test('One shrinkage → selects paragraph with origin cursor', () => {
        expect(shrinkSelection(plugin, _('| Line 1 . Line^ 2 .. Line 3 . Line 4 |'))).toBe(_('Line 1 . Line 2'));
      });
      test('Two shrinkages → selects line with origin cursor', () => {
        expect(shrinkSelection(plugin, _('| Line 1 . Line^ 2 .. Line 3 . Line 4 |'), TWO_TIMES)).toBe(_('Line 2'));
      });
      test('Two shrinkages → selects line with origin cursor', () => {
        expect(shrinkSelection(plugin, _('| Line 1 . Line^ 2 .. Line 3 . Line 4 |'), THREE_TIMES)).toBe(_('Line'));
      });
      test('Three shrinkages → restores origin cursor (nothing selected)', () => {
        expect(shrinkSelection(plugin, _('| Line 1 . Line^ 2 .. Line 3 . Line 4 |'), FOUR_TIMES)).toBe(_(''));
        expect(plugin.getEditor().getCursor()).toStrictEqual(toPos(1, 4));
        expect(plugin.getEditor().somethingSelected()).toBeFalsy();
      });
    });

  });
});
