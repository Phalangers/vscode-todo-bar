import * as vscode from 'vscode'
import { TodoBarExtension } from './extension'
import { walkForward, getMarkRange } from "./misc"

export function addPrefixesEdits(ext: TodoBarExtension, editBuilder: vscode.TextEditorEdit) {
	for (let i = 0; i < ext.parentLines.$.length; i++) {
		const line = ext.parentLines.$[i]
		const afterIgnored = walkForward(line.text, ext.configuration.$.ignoredCharacters)
		const start = afterIgnored == 0 ? afterIgnored : afterIgnored - 1
		const prefix = i == 0 ? ext.configuration.$.prefix : ext.configuration.$.lightPrefix
		const range = new vscode.Range(line.lineNumber, start, line.lineNumber, afterIgnored)
		editBuilder.replace(range, prefix)
	}
}

export function removePrefixesEdits(ext: TodoBarExtension, editBuilder: vscode.TextEditorEdit) {
	const document = ext.editor.$?.document!
	for (let i = 0; i < document.lineCount; i++) {
		const line = document.lineAt(i)
		const prefixRange = getMarkRange(ext, line)
		if (prefixRange) {
			editBuilder.replace(prefixRange, " ")
		}
	}
}
