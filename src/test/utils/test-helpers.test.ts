import { findCaretIndexes, removeCarets } from "./test-helpers"

describe('Test helper functions', () => {
    describe('findCaretIndexes', () => {
        test('Valid caret configurations', () => {
            expect(findCaretIndexes('a|b')).toStrictEqual({anchor: 1});
            expect(findCaretIndexes('|ab|')).toStrictEqual({anchor: 0, head: 2});
            expect(findCaretIndexes('^ab|')).toStrictEqual({anchor: 0, head: 2});
            expect(findCaretIndexes('|ab^')).toStrictEqual({anchor: 2, head: 0});
        })
        test('Invalid caret configurations', () => {
            expect(() => findCaretIndexes('ab')).toThrow();
            expect(() => findCaretIndexes('^ab')).toThrow();
            expect(() => findCaretIndexes('^ab^')).toThrow();
        })
    })
    test('removeCarets', () => {
        expect(removeCarets('a|b')).toBe('ab');
        expect(removeCarets('|ab|')).toBe('ab');
        expect(removeCarets('^ab|')).toBe('ab');
        expect(removeCarets('|ab^')).toBe('ab');
    })
})