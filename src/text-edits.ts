import * as vscode from 'vscode'
import { TodoBarExtension } from './extension'
import { assert, getMarkRange, lineIsMarked, walkForward } from "./misc"

export function addMarkEdit(ext: TodoBarExtension, editBuilder: vscode.TextEditorEdit) {
	const line = ext.parentLines.$[0]
	const afterIgnored = walkForward(line.text, ext.configuration.$.ignoredCharacters)
	const start = afterIgnored == 0 ? afterIgnored : afterIgnored - 1
	const range = new vscode.Range(line.lineNumber, start, line.lineNumber, afterIgnored)
	editBuilder.replace(range, ext.configuration.$.mark)
}

export function removeMarkEdit(ext: TodoBarExtension, editBuilder: vscode.TextEditorEdit) {
	const document = ext.activeEditor.$?.document
	assert(document, "removeMarksEdits: no active editor")
	for (let i = 0; i < document.lineCount; i++) {
		const line = document.lineAt(i)
		if (lineIsMarked(line, ext.configuration.$)) {
			const markRange = getMarkRange(ext, line)
			if (markRange) {
				editBuilder.replace(markRange, " ")
				break
			}
		}
	}
}

function rangeSize(range: vscode.Range) {
	return range.end.character - range.start.character
}
