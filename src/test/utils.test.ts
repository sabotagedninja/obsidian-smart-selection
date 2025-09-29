import { findCaretIndexes, removeCarets } from "./utils"

describe('Test helper functions', () => {
    describe('single caret', () => {
        test('findCaretIndexes', () => {
            expect(findCaretIndexes('a|a')).toStrictEqual([1])
        })
        test('removeCarets', () => {
            expect(removeCarets('a|a')).toBe('aa')
        })
    })
    describe('2 carets: 1 selection', () => {
        test('findCaretIndexes', () => {
            expect(findCaretIndexes('|a|')).toStrictEqual([0, 1])
        })
        test('removeCarets', () => {
            expect(removeCarets('|a|')).toBe('a')
        })
    })
})
