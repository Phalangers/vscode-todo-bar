import * as vscode from "vscode"
import { TodoBarExtension } from "../extension"
import { jumpToLine } from '../misc'
import { command_jumpToFile } from './jumpToFile'


export async function command_jumpBackAndForth(ext: TodoBarExtension) {
	console.log('jumpBackAndForth')
	const currentTodo = ext.currentTodo.$

	// File ?
	if (ext.activeEditor.$ && currentTodo) {
		// Right file ?
		if (ext.activeEditor.$.document.uri === currentTodo.fileUri) {
			// Right line ?
			if (ext.activeEditor.$.selection.active.line == ext.parentLines.$[0].lineNumber) {
				// Close file
				await vscode.commands.executeCommand('workbench.action.files.save')
				return await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
			} else if (ext.parentLines.$.length > 0) {
				return jumpToLine(ext.activeEditor.$, ext.parentLines.$[0])
			}
		}
	}
	return command_jumpToFile(ext)
}
