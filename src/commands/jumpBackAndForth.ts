import * as vscode from "vscode"
import { jumpToLine } from '../misc'
import { command_jumpToFile } from './jumpToFile'
import { TodoBarExtension } from "../extension"
import { uriToFilePath } from "../misc"


export async function command_jumpBackAndForth(ext: TodoBarExtension) {
	console.log('jumpBackAndForth')
	const currentTodo = ext.currentTodo.$

	// File ?
	if (ext.activeEditor.$ && currentTodo) {
		// Right file ?
		if (uriToFilePath(ext.activeEditor.$.document.uri) === currentTodo.file) {
			// Right line ?
			if (ext.activeEditor.$.selection.active.line == ext.lines.$[0].lineNumber) {
				// Close file
				await vscode.commands.executeCommand('workbench.action.files.save')
				return await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
			} else if (ext.lines.$.length > 0) {
				return jumpToLine(ext.activeEditor.$, ext.lines.$[0])
			}
		}
	}
	return command_jumpToFile(ext)
}
