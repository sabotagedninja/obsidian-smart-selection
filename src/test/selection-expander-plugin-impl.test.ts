import type { Editor, EditorPosition } from 'obsidian';
import SimpleMockEditor from '../__mocks__/mock-editor';
import SelectionExpanderPluginImpl from '../plugin/selection-expander-plugin-impl'
import { _, expandSelection } from './utils/test-helpers';


const TWO_TIMES = 2;

describe('SelectionExpanderImpl', () => {

  let plugin: SelectionExpanderPluginImpl;
  let editor: Editor;

  beforeEach(() => {
    editor = new SimpleMockEditor();
    plugin = new SelectionExpanderPluginImpl();
    plugin.setEditor(editor);
  });

  describe('Expand to line', () => {
    describe('No selection', () => {
      test('caret somewhere on a line', () => {
        expect(expandSelection(plugin, _('|abc . def'))).toBe(_('abc'));
        expect(expandSelection(plugin, _('ab|c . def'))).toBe(_('abc'));
        expect(expandSelection(plugin, _('abc . def|'))).toBe(_('def'));
      });
    });
    describe('Selection on single line', () => {
      test('Selection range', () => {
        expect(expandSelection(plugin, _('|a|bc . def'))).toBe(_('abc'));
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
      test('Caret on empty line after paragraph → selects paragraph above caret', () => {
        expect(expandSelection(plugin, _('abc . def .| .. ghi'))).toBe(_('abc . def .'));
      });
      test('Caret on empty line before paragraph → selects paragraph below caret', () => {
        expect(expandSelection(plugin, _('|. abc . def .. ghi'))).toBe(_('. abc . def'));
      });
      test('Caret on empty line between paragraphs → selects both paragraphs', () => {
        expect(expandSelection(plugin, _('abc .|. def .. ghi'))).toBe(_('abc .. def'));
      });
      test('Caret on line in paragraph → selects line first, then paragraph (perform 2 expansions)', () => {
        expect(expandSelection(plugin, _('abc . def| .. ghi'), TWO_TIMES)).toBe(_('abc . def'));
      });
    });
    describe('Selection within single paragraph', () => {
      test(' → selects paragraph', () => {
        expect(expandSelection(plugin, _('|abc| . def .. ghi'))).toBe(_('abc . def'));
      });
    });
  });





  test('Empty line surrounded by empty lines → selects entire document', () => {
    expect(expandSelection(plugin, _('abc ..|.. def'))).toBe(_('abc .... def'));
  });

  test('selection spans two paragraphs (partially selected) - selects those two paragraphs, not the whole document', () => {
    expect(expandSelection(plugin, _('ab|c .. de|f .. ghi'))).toBe(_('abc .. def'));
  });
  test('selection spans two paragraphs (fully selected) - select the whole document', () => {
    expect(expandSelection(plugin, _('|abc .. def| .. ghi'))).toBe(_('abc .. def .. ghi'));
  });
});
