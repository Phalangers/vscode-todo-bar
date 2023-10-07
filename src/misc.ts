import { signal } from 'ng-signals'
import * as vscode from 'vscode'
import { Configuration, TodoBarExtension } from './extension'

export function assert(condition?: any, message?: string) {
	if (!condition) {
		error(message || 'assert failed')
	}
}

export function error(message: string) {
	return vscode.window.showErrorMessage(message)
}

/**
 * Finds the first index in a string that does not match any of the symbols.
 * @returns - The index of the first character that does not match the symbols, or -1 if all match.
 */
export function firstIndexNot(str: string, symbols: string, startIndex = 0) {
	let i = startIndex
	for (; i < str.length; i++) {
		if (!symbols.includes(str[i])) {
			return i
		}
	}
	return -1
}

/**
 * Given a vscode.TextLine, counts the number of leading tabs/spaces in line.text.
 */
export function indentationLevel(line: vscode.TextLine, ignoredCharacters: string) {
	let indentation = 0
	for (const c of line.text) {
		if (!ignoredCharacters.includes(c)) {
			return indentation
		} else {
			if (c == '\t') indentation += 4
			else indentation++
		}
	}
	return -1
}

/**
 * Removes leading characters from a given text.
 *
 * @param text - The input text.
 * @param symbols - The symbols to remove from the beginning of the text.
 * @returns The text with leading characters removed.
 */
export function removeLeadingChars(text: string, symbols: string): string {
	return text.slice(firstIndexNot(text, symbols))
}

export function getPrefixRange(ext: TodoBarExtension, line: vscode.TextLine) {
	const configuration = ext.configuration.$
	if (!line.text.includes(configuration.lightPrefix) && !line.text.includes(configuration.prefix)) return null

	const beginPrefix = firstIndexNot(line.text, configuration.ignoredCharacters)
	const endPrefix = firstIndexNot(line.text, configuration.lightPrefix + configuration.prefix, beginPrefix)

	return new vscode.Range(line.lineNumber, beginPrefix, line.lineNumber, endPrefix)
}

export function uriToFilePath(uri: vscode.Uri) {
	return uri?.toString().slice(7)
}

export function variable<T>(value: T) {
	const sig = signal<T>(value)
	return {
		get $(): Readonly<T> {
			return sig()
		},
		set $(value: T) {
			sig.set(value)
		},
		mutate(mutateFn: (value: T) => void) {
			sig.mutate(mutateFn)
		},
		update(updateFn: (value: T) => T) {
			sig.update(updateFn)
		}
	}
}

export function jumpToLine(activeEditor: vscode.TextEditor, line: vscode.TextLine) {
	let cursorPosition = line.range.end
	let selection = new vscode.Selection(cursorPosition, cursorPosition)
	activeEditor.selection = selection
	activeEditor.revealRange(line.range)
}

export function findCurrentTodoLine(document: vscode.TextDocument, configuration: Configuration): number {
	let mostIndentedMark = null
	let mostIndentedLine = null
	for (let i = 0; i < document.lineCount; i++) {
		const line = document.lineAt(i)
		if (!line.text.includes(configuration.prefix)) continue
		const indentationWithPrefix = firstIndexNot(line.text, configuration.ignoredCharacters + configuration.prefix)
		if (indentationWithPrefix != -1) {
			if (!mostIndentedMark || mostIndentedMark < indentationWithPrefix) {
				mostIndentedMark = indentationWithPrefix
				mostIndentedLine = line
			}
		}
	}
	return mostIndentedLine!.lineNumber
}
