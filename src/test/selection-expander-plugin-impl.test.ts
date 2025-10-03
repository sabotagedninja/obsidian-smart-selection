import type { Editor } from 'obsidian';
import SimpleMockEditor from '../__mocks__/mock-editor';
import SelectionExpanderPluginImpl from '../plugin/selection-expander-plugin-impl'
import { _, expandSelection, shrinkSelection } from './utils/test-helpers';


const TWO_TIMES = 2;
const THREE_TIMES = 3;

describe('SelectionExpanderImpl', () => {

  let plugin: SelectionExpanderPluginImpl;
  let editor: Editor;

  beforeEach(() => {
    editor = new SimpleMockEditor();
    plugin = new SelectionExpanderPluginImpl();
    plugin.setEditor(editor);
  });

  describe('Expand selection', () => {

    describe('Expand to line', () => {
      describe('No selection', () => {
        test('Cursor somewhere on a line', () => {
          expect(expandSelection(plugin, _('|abc . def'))).toBe(_('abc'));
          expect(expandSelection(plugin, _('ab|c . def'))).toBe(_('abc'));
          expect(expandSelection(plugin, _('abc . def|'))).toBe(_('def'));
        });
      });
      describe('Selection on single line', () => {
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

    describe('Expand to paragraph', () => {
      describe('No selection', () => {
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
      describe('Selection within single paragraph', () => {
        test('Partially selected line → selects line first, then paragraph (perform 2 expansions)', () => {
          expect(expandSelection(plugin, _('|ab|c . def .. ghi'), TWO_TIMES)).toBe(_('abc . def'));
        });
        test('Partially selected paragraph (spans 2 lines) → selects paragraph', () => {
          expect(expandSelection(plugin, _('ab|c . de|f .. ghi'))).toBe(_('abc . def'));
        });
      });
      describe('Selection across multiple paragraphs', () => {
        test('Partially selected paragraphs → selects those paragraphs', () => {
          expect(expandSelection(plugin, _('ab|c .. de|f .. ghi'))).toBe(_('abc .. def'));
          expect(expandSelection(plugin, _('a|bc .. def .... g|hi .. jkl'))).toBe(_('abc .. def .... ghi'));
        });
      });
    });

    describe('Expand to document', () => {
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

    describe('Consequtive expansions', () => {
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

  describe('Shrink selection', () => {
    
    describe('Shrink to paragraph', () => {
      test('Document fully selected → selects paragraph with origin cursor', () => {
        expect(shrinkSelection(plugin, _('|abc . de^f .. ghi . jkl|'))).toBe(_('abc . def'));
      });
      test('First paragraph fully and second paragraph partially selected → selects paragraph with origin cursor', () => {
        expect(shrinkSelection(plugin, _('|abc . de^f .. ghi .| jkl'))).toBe(_('abc . def'));
      });
      test('Both paragraphs partially selected → partially selects first paragraph with origin cursor', () => {
        expect(shrinkSelection(plugin, _('ab|c . de^f .. ghi .| jkl'))).toBe(_('c . def'));
      });
    });

    describe('Shrink to line', () => {
      test('Paragraph fully selected → selects line with origin cursor', () => {
        expect(shrinkSelection(plugin, _('|abc . de^f | .. ghi . jkl'))).toBe(_('def'));
      });
      test('Paragraph partially selected → selects line with origin cursor', () => {
        expect(shrinkSelection(plugin, _('ab|c . de^f | .. ghi . jkl'))).toBe(_('def'));
      });
    });

    describe('Shrink to cursor', () => {
      test('Line fully selected → restores origin cursor (nothing selected)', () => {
        expect(shrinkSelection(plugin, _('abc . | de^f | .. ghi . jkl'))).toBe(_(''));
        expect(plugin.getEditor().getCursor()).toStrictEqual({line: 1, ch: 2});
        expect(plugin.getEditor().somethingSelected()).toBeFalsy();
      });
      test('Line partially selected → restores origin cursor (nothing selected)', () => {
        expect(shrinkSelection(plugin, _('abc . d|e^f | .. ghi . jkl'))).toBe(_(''));
        expect(plugin.getEditor().getCursor()).toStrictEqual({line: 1, ch: 2});
        expect(plugin.getEditor().somethingSelected()).toBeFalsy();
      });
    });
    
    describe('Consequtive expansions', () => {
      test('Three shrinkages → restores origin cursor (nothing selected)', () => {
        expect(shrinkSelection(plugin, _('|abc . de^f .. ghi . jkl|'), THREE_TIMES)).toBe(_(''));
        expect(plugin.getEditor().getCursor()).toStrictEqual({line: 1, ch: 2});
        expect(plugin.getEditor().somethingSelected()).toBeFalsy();
      });
    });

  });


  // TODO test helper methods

});
