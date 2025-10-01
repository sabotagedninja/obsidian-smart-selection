import type { Editor, EditorPosition } from '../__mocks__/obsidian';
import SimpleMockEditor from '../__mocks__/mock-editor';
import SelectionExpanderPluginImpl from '../plugin/selection-expander-plugin-impl'
import { expand } from '../test/utils/test-helpers';

function pos(line: number, ch: number): EditorPosition {
  return { line: line, ch: ch };
}

describe('SelectionExpanderImpl', () => {

  // P1 L1\nP1 L2\n\nP2 L1\nP2 L2\nP2 L3\n\n\n\n- B1\n  - B1.1\n  - B1.2\n
  const text = [
    'P1 L1',
    'P1 L2',
    '',
    'P2 L1',
    'P2 L2',
    'P2 L3',
    '',
    '', // Empty line surrounded by empty lines
    '',
    '- B1',
    '  - B1.1',
    '  - B1.2',
    ''
  ].join('\n');

  let plugin: SelectionExpanderPluginImpl;
  let editor: Editor;

  beforeEach(() => {
    editor = new SimpleMockEditor(text);
    plugin = new SelectionExpanderPluginImpl();
    plugin.setEditor(editor);
  });

  test('expand caret → line', () => {
    expect(expand(plugin, editor, '|abc')).toBe('abc');
    expect(expand(plugin, editor, 'a|bc')).toBe('abc');
    expect(expand(plugin, editor, 'abc|')).toBe('abc');
    expect(expand(plugin, editor, '|a|bc')).toBe('abc');
    expect(expand(plugin, editor, '^a|bc')).toBe('abc');
    expect(expand(plugin, editor, '|a^bc')).toBe('abc');
    expect(expand(plugin, editor, 'abc\nd|ef\nghi')).toBe('def');
    expect(expand(plugin, editor, 'abc\ndef\nghi|')).toBe('ghi');
  });

  test('expand line → paragraph', () => {
    const expandTwoTimes = 2;
    expect(expand(plugin, editor, 'abc\ndef|', expandTwoTimes)).toBe('abc\ndef');
    expect(expand(plugin, editor, 'abc\ndef\n|')).toBe('abc\ndef\n');
    expect(expand(plugin, editor, '|\nabc\ndef')).toBe('\nabc\ndef');
    expect(expand(plugin, editor, 'abc\n|\ndef')).toBe('abc\n\ndef');
  });

  test('Empty line surrounded by empty lines → selects entire document', () => {
    expect(expand(plugin, editor, 'abc\n\n|\n\ndef')).toBe('abc\n\n\n\ndef');
  });

  test('anchor is reset correctly at second expand cycle', () => {
    expect(expand(plugin, editor, 'abc\n\n|\n\ndef\nghi')).toBe('abc\n\n\n\ndef\nghi');
    expect(editor.offsetToPos(plugin['cursor'])).toStrictEqual(pos(2, 0));
    // But then...

    editor.setSelection(pos(5, 2), pos(4, 2));
    expect(editor.offsetToPos(plugin['cursor'])).toStrictEqual(pos(5, 2));
    expect(editor.getCursor('from')).toStrictEqual(pos(4, 4));
    expect(editor.getCursor('to')).toStrictEqual(pos(5, 4));

    plugin.expandSelectionCycle();
    expect(plugin.getCursor()).toStrictEqual(pos(4, 4));
    expect(editor.getCursor('from')).toStrictEqual(pos(3, 0));
    expect(editor.getCursor('to')).toStrictEqual(pos(5, 5));
    expect(editor.getSelection()).toBe('P2 L1\nP2 L2\nP2 L3');
  });

  test('selection spans two paragraphs', () => {});


});
