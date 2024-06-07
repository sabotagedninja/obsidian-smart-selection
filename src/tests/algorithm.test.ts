import { Selection } from '../main/algorithm'
import { _expand } from './utils'

describe('class Selection', () => {
    test('constructor OK', () => expect(() => new Selection('', 0, 0)).not.toThrow())
    test('constructor invalid argument 1', () => expect(() => new Selection(null, 0, 0)).toThrow())
    test('constructor invalid argument 2', () => expect(() => new Selection('', -1, 0)).toThrow())
    test('constructor invalid argument 3', () => expect(() => new Selection('', 0, -1)).toThrow())
})
describe('expand', () => {
    describe('No selection, one caret', () => {
        test('no text', () => expect(_expand('|')).toBe(''))
        test('single space 1', () => expect(_expand('| ')).toBe(' '/*1 space*/))
        test('single space 2', () => expect(_expand(' |')).toBe(' '/*1 space*/))
        test('two spaces', () => expect(_expand(' | ')).toBe('  '/*2 spaces*/))
        test('single space before period', () => expect(_expand(' |.')).toBe(' '/*1 space*/))
        test('single word 1', () => expect(_expand('|ab')).toBe('ab'))
        test('single word 2', () => expect(_expand('a|b')).toBe('ab'))
        test('single word 3', () => expect(_expand('ab|')).toBe('ab'))
        test('single word in sentence 1', () => expect(_expand('a |bc d')).toBe('bc'))
        test('single word in sentence 2', () => expect(_expand('a b|c d')).toBe('bc'))
        test('single word in sentence 3', () => expect(_expand('a bc| d')).toBe('bc'))
        test('single word in sentence with punctuation mark 1', () => expect(_expand('a |bc. d')).toBe('bc'))
        test('single word in sentence with punctuation mark 2', () => expect(_expand('a b|c. d')).toBe('bc'))
        test('single word in sentence with punctuation mark 3', () => expect(_expand('a bc|. d')).toBe('bc'))
        test('single word in sentence with punctuation mark 4', () => expect(_expand('a |bbb.ccc. d')).toBe('bbb'))
        test('single word in sentence with punctuation mark 5', () => expect(_expand('a bbb|.ccc. d')).toBe('bbb'))
        test('single word in sentence with punctuation mark 6', () => expect(_expand('a bbb.ccc|. d')).toBe('ccc'))
        test('punctuation marks 1', () => expect(_expand('.|,')).toBe('.,'))
    })
    describe('One selection, two carets', () => {
        test('selection 1', () => expect(_expand('a|a|a')).toBe('aaa'))
        test('selection 1', () => expect(_expand('a |b|b')).toBe('bb'))
        test('selection 1', () => expect(_expand('a |bb|')).toBe(' bb'))
        // FIXME this process takes too many steps! Spaces should not be selected in individual steps.
        // Proposition - selection steps: word, sentence in a line, line, paragraph, everything
        test('selection 1', () => expect(_expand('a. b c|c |d. e')).toBe('cc d'))
        test('selection 1', () => expect(_expand('a. b |cc d|. e')).toBe(' cc d'))
        test('selection 1', () => expect(_expand('a. b| cc d|. e')).toBe('b cc d'))
        test('selection 1', () => expect(_expand('a. |b cc d|. e')).toBe(' b cc d'))
        test('selection 1', () => expect(_expand('a.| b cc d|. e')).toBe('. b cc d.'))
        test('selection 1', () => expect(_expand('a|. b cc d.| e')).toBe('a. b cc d.'))
        test('selection 1', () => expect(_expand('|a. b cc d.| e')).toBe('a. b cc d. '))
        test('selection 1', () => expect(_expand('|a. b cc d. |e')).toBe('a. b cc d. e'))
    })
})

export { }

