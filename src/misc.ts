import { signal as ngSignal } from 'ng-signals'
import * as vscode from 'vscode'
import { Configuration, TodoBarExtension } from './extension'

export function assert(condition?: any, message?: string) {
	if (!condition) {
		error(message || 'assert failed')
	}
}

export function error(message: string) {
	return vscode.window.showErrorMessage("Extension: TodoBar: " + message)
}

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
export function measureIndentation(line: string, ignoredCharacters: string) {
	let indentation = 0
	for (const c of line) {
		if (!ignoredCharacters.includes(c)) {
			break
		}
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

export function getMarkRange(ext: TodoBarExtension, line: vscode.TextLine) {
	const configuration = ext.configuration.$
	if (!line.text.includes(configuration.lightPrefix) && !line.text.includes(configuration.prefix)) return null

	const beginPrefix = walkForward(line.text, configuration.ignoredCharacters)
	const endPrefix = walkForward(line.text, configuration.lightPrefix + configuration.prefix, beginPrefix)

	return new vscode.Range(line.lineNumber, beginPrefix, line.lineNumber, endPrefix)
}

export function uriToFilePath(uri: vscode.Uri) {
	return uri?.toString().slice(7)
}

export function signal<T>(value: T) {
	const sig = ngSignal<T>(value)
	Object.defineProperties(sig, {
		$: {
			get: () => { return sig() },
			set: (value) => { sig.set(value) },
		},
		changed: {
			get: () => { sig.mutate(value => value) }
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
		if (!line.text.includes(configuration.prefix)) continue
		const indentation = measureIndentation(line.text, configuration.ignoredCharacters)
		if (indentation > maxIndentation) {
			maxIndentation = indentation
			maxIndentationLine = line
		}
	}
	if (maxIndentationLine) {
		return maxIndentationLine.lineNumber
	} else {
		return null
	}
}
