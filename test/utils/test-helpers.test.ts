import { _, findCursorIndexes, removeCursorSymbols } from "./test-helpers"

describe('Test helper functions', () => {
    describe('Function: findCursorIndexes', () => {
        describe('Valid cursor configurations', () => {
            test('Caret (or blinking cursor) - no selection', () => {
                expect(findCursorIndexes('a|bc')).toStrictEqual({ anchor: 1 });
            });
            test('Selection', () => {
                expect(findCursorIndexes('a|bc|')).toStrictEqual({ anchor: 1, head: 3 });
            });
            test('Forward selection', () => {
                expect(findCursorIndexes('a^bc|')).toStrictEqual({ anchor: 1, head: 3 });
            });
            test('Backward selection', () => {
                expect(findCursorIndexes('a|bc^')).toStrictEqual({ anchor: 3, head: 1 });
            });
            test('Selection with origin', () => {
                expect(findCursorIndexes('a|b^c|')).toStrictEqual({ anchor: 1, head: 3, origin: 2 });
            });
        });
        describe('Invalid cursor configurations', () => {
            test('No cursors', () => {
                expect(() => findCursorIndexes('abc')).toThrow();
            });
            test('Origin cursor(s) without normal cursor(s)', () => {
                expect(() => findCursorIndexes('^abc')).toThrow();
            });
            test('Origin outside of selection', () => {
                expect(() => findCursorIndexes('|ab|c^')).toThrow();
            });
            test('Cursor count > 3', () => {
                expect(() => findCursorIndexes('|a^b|c|')).toThrow();
            });
        });
    });
    test('Function: removeCursorSymbols', () => {
        expect(removeCursorSymbols('|a^bc|')).toBe('abc');
    });
    describe('Function: _', () => {
        test('Trim lines (remove spaces) and replace . with \n', () => {
            expect(_('  Line 1 . Line 2  ')).toBe('Line 1\nLine 2');
            expect(_('Line 1 . Line 2')).toBe('Line 1\nLine 2');
            expect(_('Line 1 .  . Line 2')).toBe('Line 1\n\nLine 2');
            expect(_('Line 1 . Line 2 .. Line 3')).toBe('Line 1\nLine 2\n\nLine 3');
        });
        test('Spaces around cursors at start and end of line are trimmed', () => {
            expect(_('| Line 1 . Line 2 |')).toBe('|Line 1\nLine 2|');
            expect(_('| Line 1 . Line 2 ^')).toBe('|Line 1\nLine 2^');
            expect(_('^ Line 1 . Line 2 |')).toBe('^Line 1\nLine 2|');
        });
        test('Spaces around cursors inside a line are kept as-is', () => {
            expect(_('| Li ^ ne 1 . Line 2 |')).toBe('|Li ^ ne 1\nLine 2|');
        });
    });
});
