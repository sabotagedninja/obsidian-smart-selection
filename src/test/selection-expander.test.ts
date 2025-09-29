// import { describe, it, expect, beforeEach } from 'vitest';
import SelectionExpanderLogic from 'src/main/selection-expander-logic';
import type { EditorPosition } from 'obsidian';

describe('SelectionExpanderPlugin', () => {
  let plugin: SelectionExpanderLogic;

  const text = [
    'First line of doc',
    '',
    'Para A line 1',
    'Para A line 2',
    '',
    'Para B line 1',
    'Para B line 2',
  ].join('\n');

  beforeEach(() => {
    plugin = new SelectionExpanderLogic();
  });

  it('expands from caret to line', () => {
    const pos: EditorPosition = { line: 2, ch: 5 };
    editor.setCursor(pos);
    plugin['expandSelectionCycle']();
    expect(editor.getSelection()).toBe(editor.getLine(2));
  });

  it('expands line → paragraph', () => {
    const pos: EditorPosition = { line: 2, ch: 0 };
    editor.setCursor(pos);
    plugin['expandSelectionCycle'](); // line
    plugin['expandSelectionCycle'](); // paragraph
    const sel = editor.getSelection();
    expect(sel).toContain('Para A line 1');
    expect(sel).toContain('Para A line 2');
  });

  it('expands paragraph → document', () => {
    const pos: EditorPosition = { line: 0, ch: 0 };
    editor.setCursor(pos);
    plugin['expandSelectionCycle'](); // line
    plugin['expandSelectionCycle'](); // paragraph
    plugin['expandSelectionCycle'](); // document
    const sel = editor.getSelection();
    expect(sel).toContain('First line of doc');
    expect(sel).toContain('Para B line 2');
  });

  it('shrinks document → paragraph → line → caret (restores anchor)', () => {
    const anchor: EditorPosition = { line: 5, ch: 3 };
    editor.setCursor(anchor);
    plugin['expandSelectionCycle'](); // line
    plugin['expandSelectionCycle'](); // paragraph
    plugin['expandSelectionCycle'](); // document

    plugin['shrinkSelectionCycle'](); // to paragraph
    expect(editor.getSelection()).toContain('Para A');
    plugin['shrinkSelectionCycle'](); // to line
    expect(editor.getSelection()).toBe(editor.getLine(5));
    plugin['shrinkSelectionCycle'](); // to caret
    expect(editor.getCursor()).toEqual(anchor);
  });
});
