import { signal as ngSignal } from 'ng-signals'
import * as vscode from 'vscode'
import { Configuration, TodoBarExtension } from './extension'

export function assert(condition: any, message = 'assert failed'): asserts condition {
	if (!condition) {
		error(message)
		throw new Error(message)
	}
}

export function error(message: string) {
	return vscode.window.showErrorMessage("Extension: TodoBar: " + message)
}

export const NO_CURRENT_TODO_ERROR = `Can't jump to line, it is not set.\nUse command [Set Todo] (default: ctrl+alt+q) to set a todo.`

/**
 * Walks forward as long as the `chars` match the string.
 */
export function walkForward(str: string, chars: string, startIndex = 0) {
	let i = startIndex
	for (; i < str.length; i++) {
		if (!chars.includes(str[i])) {
			break
		}
	}
	return i
}



/**
 * Given a vscode.TextLine, counts the number of leading tabs/spaces in line.text.
 */
export function measureIndentation(text: string, ignoredCharacters: string) {
	const startOfText = walkForward(text, ignoredCharacters)

	let indentation = 0
	for (let i = 0; i < startOfText; i++) {
		const c = text[i]
		if (c == '\t') indentation += 4
		else indentation++
	}
	return indentation
}

/**
 * Removes leading characters from a given text.
 */
export function removeLeadingChars(text: string, symbols: string): string {
	const firstIndex = walkForward(text, symbols)
	if (firstIndex) {
		return text.slice(firstIndex)
	} else {
		return text
	}
}

export function getMarkRange(ext: TodoBarExtension, line: vscode.TextLine): vscode.Range | null {
	const configuration = ext.configuration.$
	if (!line.text.includes(configuration.mark)) return null
	const beginMark = walkForward(line.text, configuration.ignoredCharacters)
	return new vscode.Range(line.lineNumber, beginMark, line.lineNumber, beginMark + 1)
}

export function signal<T>(value: T) {
	const sig = ngSignal<T>(value)
	Object.defineProperties(sig, {
		$: {
			get: () => { return sig() },
			set: (value) => { sig.set(value) },
		},
		changed: {
			value: () => { sig.mutate(value => value) }
		}
	})

	return sig as typeof sig & {
		get $(): T
		set $(value: T)
		changed(): void
	}
}

export function jumpToLine(activeEditor: vscode.TextEditor, line: vscode.TextLine) {
	let cursorPosition = line.range.end
	let selection = new vscode.Selection(cursorPosition, cursorPosition)
	activeEditor.selection = selection
	activeEditor.revealRange(line.range)
}

export function findMarkedLine(document: vscode.TextDocument, configuration: Configuration): number | null {
	let maxIndentationLine = null
	let maxIndentation = 0
	for (let i = 0; i < document.lineCount; i++) {
		const line = document.lineAt(i)
		if (lineIsMarked(line, configuration)) {
			return line.lineNumber
		}
	}
	return null
}

export function lineIsMarked(line: vscode.TextLine, configuration: Configuration) {
	if (!line.text.includes(configuration.mark)) return false

	const startOfText = walkForward(line.text, configuration.ignoredCharacters)
	if (!configuration.mark.includes(line.text[startOfText])) return false

	return true
}
