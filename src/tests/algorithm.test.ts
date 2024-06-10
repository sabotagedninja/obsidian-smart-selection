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
        test('selection 2', () => expect(_expand('a |b|b')).toBe('bb'))
        test('selection 3', () => expect(_expand('a |bb|')).toBe(' bb'))
        // FIXME this process takes too many steps! Spaces should not be selected in individual steps.
        // Proposition - selection steps: word, sentence in a line, line, paragraph, everything
        test('continues selection 1 - TOO MANY STEPS', () => expect(_expand('a. b c|c d. e')).toBe('cc'))
        test('continues selection 2 - TOO MANY STEPS', () => expect(_expand('a. b |cc| d. e')).toBe(' cc '))
        test('continues selection 3 - TOO MANY STEPS', () => expect(_expand('a. b| cc |d. e')).toBe('b cc d'))
        test('continues selection 4 - TOO MANY STEPS', () => expect(_expand('a. |b cc d|. e')).toBe(' b cc d'))
        test('continues selection 5 - TOO MANY STEPS', () => expect(_expand('a.| b cc d|. e')).toBe('. b cc d.'))
        test('continues selection 6 - TOO MANY STEPS', () => expect(_expand('a|. b cc d.| e')).toBe('a. b cc d.'))
        test('continues selection 7 - TOO MANY STEPS', () => expect(_expand('|a. b cc d.| e')).toBe('a. b cc d. '))
        test('continues selection 8 - TOO MANY STEPS', () => expect(_expand('|a. b cc d. |e')).toBe('a. b cc d. e'))
        // ---
        test('continues selection 1 - LESS STEPS', () => 
            expect(_expand('Document. \n\n Paragraph. \n Line. Sentence wo|rd. \n')).toBe('word'))
        test('continues selection 2 - LESS STEPS', () => 
            expect(_expand('Document. \n\n Paragraph. \n Line. Sentence |word|. \n')).toBe('Sentence word.'))
        test('continues selection 3 - LESS STEPS', () => 
            expect(_expand('Document. \n\n Paragraph. \n Line. |Sentence word.| \n')).toBe('Line. Sentence word. \n'))
        test('continues selection 3 - LESS STEPS', () => 
            expect(_expand('Document. \n\n Paragraph. \n |Line. Sentence word. \n|')).toBe('Paragraph. \n Line. Sentence word. \n'))
        test('continues selection 4 - LESS STEPS', () => 
            expect(_expand('Document. \n\n |Paragraph. \n Line. Sentence word. \n|')).toBe('Document. \n\n Paragraph 1. \n Sentence word. \n'))

    })
})

export { }

