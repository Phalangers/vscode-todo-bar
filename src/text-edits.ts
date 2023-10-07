import * as vscode from 'vscode'
import { TodoBarExtension } from './extension'
import { firstIndexNot, getPrefixRange } from "./misc"

export function addPrefixesEdits(ext: TodoBarExtension, editBuilder: vscode.TextEditorEdit) {
	for (let i = 0; i < ext.lines.length; i++) {
		const line = ext.lines[i]
		const index = firstIndexNot(line.text, ext.configuration.$.ignoredCharacters)
		const start = index > 0 ? index - 1 : index
		const prefix = i == 0 ? ext.configuration.$.prefix : ext.configuration.$.lightPrefix
		const range = new vscode.Range(line.lineNumber, start, line.lineNumber, index)
		editBuilder.replace(range, prefix)
	}
}

export function removePrefixesEdits(ext: TodoBarExtension, editBuilder: vscode.TextEditorEdit) {
	const document = ext.activeEditor.$?.document!
	for (let i = 0; i < document.lineCount; i++) {
		const line = document.lineAt(i)
		const prefixRange = getPrefixRange(ext, line)
		if (prefixRange) {
			editBuilder.replace(prefixRange, " ")
		}
	}
}
