import * as vscode from 'vscode'
import { TodoBarExtension } from './extension'
import { walkForward, getMarkRange, lineIsMarked, lineIsMarkedAll } from "./misc"

export function addMarksEdits(ext: TodoBarExtension, editBuilder: vscode.TextEditorEdit) {
	for (let i = 0; i < ext.parentLines.$.length; i++) {
		const line = ext.parentLines.$[i]
		const afterIgnored = walkForward(line.text, ext.configuration.$.ignoredCharacters)
		const start = afterIgnored == 0 ? afterIgnored : afterIgnored - 1
		const mark = i == 0 ? ext.configuration.$.mark : ext.configuration.$.lightMark
		const range = new vscode.Range(line.lineNumber, start, line.lineNumber, afterIgnored)
		editBuilder.replace(range, mark)
	}
}

export function removeMarksEdits(ext: TodoBarExtension, editBuilder: vscode.TextEditorEdit) {
	const document = ext.activeEditor.$?.document!
	for (let i = 0; i < document.lineCount; i++) {
		const line = document.lineAt(i)
		if (!lineIsMarkedAll(line, ext.configuration.$)) continue
		const markRange = getMarkRange(ext, line)
		if (markRange) {
			editBuilder.replace(markRange, " ".repeat(rangeSize(markRange)))
		}
	}
}

function rangeSize(range: vscode.Range) {
	return range.end.character - range.start.character
}
