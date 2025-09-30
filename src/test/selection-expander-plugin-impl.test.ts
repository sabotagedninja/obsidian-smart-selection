import type { EditorPosition } from 'obsidian';
import SelectionExpanderPluginImpl from '../main/selection-expander-plugin-impl'
import { MockEditor } from './__mocks__/mock-editor';

function pos(line: number, ch: number): EditorPosition {
  return {line: line, ch: ch};
}

describe('SelectionExpanderImpl', () => {

  // "P1 L1\nP1 L2\n\nP2 L1\nP2 L2\nP2 L3\n\n\n\n- B1\n  - B1.1\n  - B1.2\n"
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
  let editor: MockEditor;

  beforeEach(() => {
    editor = new MockEditor(text);
    plugin = new SelectionExpanderPluginImpl();
    plugin.setEditor(editor);
  });

  test('expands caret → line', () => {
    editor.setCursor(pos(0, 0));
    plugin.expandSelectionCycle();
    expect(editor.getSelection()).toBe('P1 L1');
    expect(plugin.getCursor()).toStrictEqual(pos(0, 0));
  });

  test('expands caret → line', () => {
    editor.setCursor(pos(1, 0));
    plugin.expandSelectionCycle();
    expect(editor.getSelection()).toBe('P1 L2');
    expect(plugin.getCursor()).toStrictEqual(pos(1, 0));
  });

  test('expands caret → paragraph', () => {
    editor.setCursor(pos(2, 0));
    plugin.expandSelectionCycle();
    expect(editor.getSelection()).toBe("P1 L1\nP1 L2\n\nP2 L1\nP2 L2\nP2 L3");
    expect(plugin.getCursor()).toStrictEqual(pos(2, 0));
  });
  
  test('anchor is reset correctly at second expand cycle', () => {
    editor.setCursor(pos(7, 0)); // The empty line surrounded by empty lines
    plugin.expandSelectionCycle(); // Selects entire document
    expect(editor.getSelection()).toBe(text);
    expect(plugin.getCursor()).toStrictEqual(pos(7, 0));
    // But then...
    
    editor.setSelection(pos(4, 4), pos(5, 4)); // P2 L|2 → P2 L|3
    expect(plugin.getCursor()).toStrictEqual(pos(4, 4));
    expect(editor.getCursor("from")).toStrictEqual(pos(4, 4));
    expect(editor.getCursor("to")).toStrictEqual(pos(5, 4));

    plugin.expandSelectionCycle();
    expect(plugin.getCursor()).toStrictEqual(pos(4, 4));
    expect(editor.getCursor("from")).toStrictEqual(pos(3, 0));
    expect(editor.getCursor("to")).toStrictEqual(pos(5, 5));
    expect(editor.getSelection()).toBe("P2 L1\nP2 L2\nP2 L3");
  });

  test('selection spans two paragraphs', () => {
    editor.setSelection(pos(1, 4), pos(3, 4)); // P1 L|2 → P2 L|1
    expect(plugin.getCursor()).toStrictEqual(pos(1, 4));
    expect(editor.getCursor("from")).toStrictEqual(pos(1, 4));
    expect(editor.getCursor("to")).toStrictEqual(pos(3, 4));

    plugin.expandSelectionCycle();
    expect(plugin.getCursor()).toStrictEqual(pos(1, 4));
    expect(editor.getCursor("from")).toStrictEqual(pos(0, 0));
    expect(editor.getCursor("to")).toStrictEqual(pos(5, 5));
    expect(editor.getSelection()).toBe("P1 L1\nP1 L2\n\nP2 L1\nP2 L2\nP2 L3");
  });
  

  // test('expands line → paragraph', () => {
  //   const pos: EditorPosition = { line: 2, ch: 0 };
  //   editor.setCursor(pos);
  //   plugin.expandSelectionCycle(editor); // line
  //   plugin.expandSelectionCycle(editor); // paragraph
  //   const sel = editor.getSelection();
  //   expect(sel).toContain('Para A line 1');
  //   expect(sel).toContain('Para A line 2');
  // });

  // test('expands paragraph → document', () => {
  //   const pos: EditorPosition = { line: 0, ch: 0 };
  //   editor.setCursor(pos);
  //   plugin.expandSelectionCycle(editor); // line
  //   plugin.expandSelectionCycle(editor); // paragraph
  //   plugin.expandSelectionCycle(editor); // document
  //   const sel = editor.getSelection();
  //   expect(sel).toContain('First line of doc');
  //   expect(sel).toContain('Para B line 2');
  // });

  // test('shrinks document → paragraph → line → caret (restores anchor)', () => {
  //   const anchor: EditorPosition = { line: 5, ch: 3 };
  //   editor.setCursor(anchor);
  //   plugin.expandSelectionCycle(editor); // line
  //   plugin.expandSelectionCycle(editor); // paragraph
  //   plugin.expandSelectionCycle(editor); // document

  //   plugin.shrinkSelectionCycle(editor); // to paragraph
  //   expect(editor.getSelection()).toContain('Para A');
  //   plugin.shrinkSelectionCycle(editor); // to line
  //   expect(editor.getSelection()).toBe(editor.getLine(5));
  //   plugin.shrinkSelectionCycle(editor); // to caret
  //   expect(editor.getCursor()).toEqual(anchor);
  // });
});
