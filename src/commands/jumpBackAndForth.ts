import * as vscode from "vscode"
import { getParentLines, TodoBarExtension } from "../extension"
import { error, findMarkedLine, jumpToLine, NO_CURRENT_TODO_ERROR } from '../misc'
import { command_jumpToFile } from './jumpToFile'


export async function command_jumpBackAndForth(ext: TodoBarExtension) {
	console.log('jumpBackAndForth')
	const currentTodo = ext.currentTodo

	// File ?
	const activeEditor = ext.activeEditor.$
	if (activeEditor) {
		if (currentTodo.$) {
			// Right file ?
			if (activeEditor.document.uri === currentTodo.$.fileUri) {
				// Do we know the current line ?
				if (currentTodo.$.line) {
					// Right line ?
					if (activeEditor.selection.active.line == currentTodo.$.line) {
						// Close file
						await vscode.commands.executeCommand('workbench.action.files.save')
						await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
					} else if (ext.parentLines.$.length > 0) {
						jumpToLine(activeEditor, ext.parentLines.$[0])
					}
				}
			}
		} else /* No currentTodo */ {
			const newCurrentLine = findMarkedLine(activeEditor.document, ext.configuration.$)
			if (newCurrentLine) {
				currentTodo.$ = {
					fileUri: activeEditor.document.uri,
					line: newCurrentLine
				}
			} else {
				error(NO_CURRENT_TODO_ERROR)
			}
		}
		const line = currentTodo.$?.line
		if (line) {
			ext.parentLines.$ = getParentLines(activeEditor.document, line)
		}
		ext.highlights.updateThrottled()
	} else {
		command_jumpToFile(ext)
	}
}
