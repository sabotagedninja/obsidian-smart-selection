import type { Editor, EditorPosition } from 'obsidian';
import SimpleMockEditor from '../__mocks__/mock-editor';
import SelectionExpanderPluginImpl from '../plugin/selection-expander-plugin-impl'
import { expandSelection } from './utils/test-helpers';

function pos(line: number, ch: number): EditorPosition {
  return { line: line, ch: ch };
}

describe('SelectionExpanderImpl', () => {

  let plugin: SelectionExpanderPluginImpl;
  let editor: Editor;

  beforeEach(() => {
    editor = new SimpleMockEditor();
    plugin = new SelectionExpanderPluginImpl();
    plugin.setEditor(editor);
  });

  test('expand caret → line', () => {
    expect(expandSelection(plugin, '|abc')).toBe('abc');
    expect(expandSelection(plugin, 'a|bc')).toBe('abc');
    expect(expandSelection(plugin, 'abc|')).toBe('abc');
    expect(expandSelection(plugin, '|a|bc')).toBe('abc');
    expect(expandSelection(plugin, '^a|bc')).toBe('abc');
    expect(expandSelection(plugin, '|a^bc')).toBe('abc');
    expect(expandSelection(plugin, 'abc\nd|ef\nghi')).toBe('def');
    expect(expandSelection(plugin, 'abc\ndef\nghi|')).toBe('ghi');
  });

  test('expand line → paragraph', () => {
    const expandTwoTimes = 2;
    expect(expandSelection(plugin, 'abc\ndef|', expandTwoTimes)).toBe('abc\ndef');
    expect(expandSelection(plugin, 'abc\ndef\n|')).toBe('abc\ndef\n');
    expect(expandSelection(plugin, '|\nabc\ndef')).toBe('\nabc\ndef');
    expect(expandSelection(plugin, 'abc\n|\ndef')).toBe('abc\n\ndef');
  });

  test('Empty line surrounded by empty lines → selects entire document', () => {
    expect(expandSelection(plugin, 'abc\n\n|\n\ndef')).toBe('abc\n\n\n\ndef');
  });

  test('selection spans two paragraphs', () => {});


});
