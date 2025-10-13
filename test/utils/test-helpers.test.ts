import { _, findCursorIndexes, removeCursorSymbols } from "./test-helpers"

describe('Test helper functions', () => {
    describe('findCursorIndexes', () => {
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
    test('removeCursorSymbols', () => {
        expect(removeCursorSymbols('|a^bc|')).toBe('abc');
    });
    describe('Remove spaces and replace . with \n', () => {
        test('_', () => {
            expect(_('abc . def .. ghi')).toBe('abc\ndef\n\nghi');
        });
    });
});
