import { Editor } from 'obsidian';
import { toPos, toRange, toSelection, posEquals, posGTE, posGT, posLTE, posLT, rangeEquals, rangeContains, rangeContainsPartial, rangeContainsPos, rangeIntersects, getIntersection, getUnion } from '../../src/functions'
import EditorStub from './obsidian-editor-stub';
import { _ } from '../utils/test-helpers';

describe('Obsidian Editor stub', () => {

    let editor: Editor;

    beforeEach(() => {
        editor = new EditorStub();
    });

    test('getValue → initially empty', () => {
        expect(editor.getValue()).toBe('');
    });
    test('setValue/getValue → single line → "abc"', () => {
        editor.setValue('abc');
        expect(editor.getValue()).toBe('abc');
    });
    test('setValue/getValue → multi line → '+_('"abc.def"'), () => {
        editor.setValue(_('abc . def'));
        expect(editor.getValue()).toBe(_('abc . def'));
    });
    test('getline → "abc", "def"', () => {
        editor.setValue(_('abc . def'));
        expect(editor.getLine(0)).toBe('abc');
        expect(editor.getLine(1)).toBe('def');
    });
    test('lineCount → 2', () => {
        editor.setValue(_('abc . def'));
        expect(editor.lineCount()).toBe(2);
    });
    test('lastLine → 1', () => {
        editor.setValue(_('abc . def'));
        expect(editor.lastLine()).toBe(1);
    });
    test('setCursor → (line, ch) → {1,2}', () => {
        editor.setCursor(1, 2);
        expect(editor.getCursor()).toStrictEqual(toPos(1, 2));
    });
    test('setCursor → (pos) → {1, 2}', () => {
        editor.setCursor(toPos(1, 2));
        expect(editor.getCursor()).toStrictEqual(toPos(1, 2));
    });
    test('setCursor → (number) → INVALID, BUT WORKS → {1, 0}', () => {
        editor.setCursor(1); // Preferably invalid, but technically works. Means {line:1, ch:0}
        expect(editor.getCursor()).toStrictEqual(toPos(1, 0));
    });
    test('getCursor → <default>|from|to|head|anchor → {0,1}, {1,2}', () => {
        editor.setValue(_('abc . def'));
        // Using setSelection() to control the different cursors
        editor.setSelection(toPos(0, 1), toPos(1, 2))
        expect(editor.getCursor()).toStrictEqual(toPos(0, 1)); // Defaults to anchor
        expect(editor.getCursor('anchor')).toStrictEqual(toPos(0, 1));
        expect(editor.getCursor('head')).toStrictEqual(toPos(1, 2));
        expect(editor.getCursor('from')).toStrictEqual(toPos(0, 1));
        expect(editor.getCursor('to')).toStrictEqual(toPos(1, 2));
    });
    test('getCursor → <default>|from|to|head|anchor → backward selection → {0,1}, {1,2}', () => {
        editor.setValue(_('abc . def'));
        // Using setSelection() to control the different cursors
        editor.setSelection(toPos(1, 2), toPos(0, 1))
        expect(editor.getCursor()).toStrictEqual(toPos(1, 2)); // Defaults to anchor
        expect(editor.getCursor('anchor')).toStrictEqual(toPos(1, 2));
        expect(editor.getCursor('head')).toStrictEqual(toPos(0, 1));
        expect(editor.getCursor('from')).toStrictEqual(toPos(0, 1));
        expect(editor.getCursor('to')).toStrictEqual(toPos(1, 2));
    });
    test('somethingSelected → false, true', () => {
        editor.setValue(_('abc . def'));
        // Nothing selected
        expect(editor.somethingSelected()).toBeFalsy();
        // Select something
        editor.setSelection(toPos(0, 0), toPos(0, 3));
        expect(editor.somethingSelected()).toBeTruthy();
    });
    test('setSelection → (anchor) → nothing selected', () => {
        editor.setValue(_('abc . def'));
        // Only supplying anchor == setCursor(anchor), results in nothing selected
        editor.setSelection(toPos(0, 1));
        expect(editor.somethingSelected()).toBeFalsy();
    });
    test('setSelection/getSelection → (anchor, head) → "abc", "def"', () => {
        editor.setValue(_('abc . def'));
        // Select first line
        editor.setSelection(toPos(0, 0), toPos(0, 3));
        expect(editor.getSelection()).toBe('abc');
        // Select second line
        editor.setSelection(toPos(1, 0), toPos(1, 3));
        expect(editor.getSelection()).toBe('def');
    });
    test('getRange → (from, to) → "abc", "def"', () => {
        editor.setValue(_('abc . def'));
        expect(editor.getRange(toPos(0, 0), toPos(0, 3))).toBe('abc');
        expect(editor.getRange(toPos(1, 0), toPos(1, 3))).toBe('def');
    });
    test('wordAt → (pos) → {{0,0},{0,3}}, {{1,0},{1,3}}', () => {
        editor.setValue(_('abc . def'));
        expect(editor.wordAt(toPos(0, 1))).toStrictEqual(toRange(toPos(0, 0), toPos(0, 3)));
        expect(editor.wordAt(toPos(1, 3))).toStrictEqual(toRange(toPos(1, 0), toPos(1, 3)));
        expect(editor.wordAt(toPos(1, 4))).toBeNull(); // Out of range
        expect(editor.wordAt(toPos(2, 0))).toBeNull(); // Out of range
    });
    test('posToOffset → (pos) → 1, 6', () => {
        editor.setValue(_('abc . def'));
        expect(editor.posToOffset(toPos(0, 1))).toBe(1);
        expect(editor.posToOffset(toPos(1, 2))).toBe(6);
    });
    test('offsetToPos → (offset) → {0,1}, {1,2}', () => {
        editor.setValue(_('abc . def'));
        expect(editor.offsetToPos(1)).toStrictEqual(toPos(0, 1));
        expect(editor.offsetToPos(6)).toStrictEqual(toPos(1, 2));
    });


});
