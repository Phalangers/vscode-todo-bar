import * as vscode from "vscode"
import { TodoBarExtension, getParentLines } from "../extension"
import { assert, error, findMarkedLine, jumpToLine } from '../misc'


export async function command_jumpToFile(ext: TodoBarExtension) {
	console.log('jumpToFile')

	const todoFilePath = ext.configuration.$.todoFilePath
	if (todoFilePath) {
		ext.currentTodo.$ = {
			fileUri: vscode.Uri.file(todoFilePath),
			line: -1
		}
	} else {
		assert(ext.currentTodo, NO_CURRENT_TODO_ERROR)
	}

	if (!ext.currentTodo.$) return error(NO_CURRENT_TODO_ERROR)

	const doc = await vscode.workspace.openTextDocument(ext.currentTodo.$.fileUri)
	await vscode.window.showTextDocument(doc)

	if (doc.fileName.startsWith('Untitled-')) {
		vscode.commands.executeCommand('workbench.action.closeActiveEditor')
		throw new Error('Untitled file containing the todo has been lost')
	}

	const activeEditor = ext.activeEditor.$
	if (activeEditor) {
		if (ext.currentTodo.$) {
			const newCurrentLine = findMarkedLine(activeEditor.document, ext.configuration.$)
			ext.currentTodo.$.line = newCurrentLine
			ext.currentTodo.changed()
		}

		ext.parentLines.$ = getParentLines(activeEditor.document, ext.currentTodo.$.line!)

		if (ext.parentLines.$?.length > 0) {
			jumpToLine(activeEditor, ext.parentLines.$[0])
		}
		ext.highlights.updateThrottled()
	}

}

const NO_CURRENT_TODO_ERROR = `Can't jump to line, it is not set.\nUse command [Set Todo] (default: ctrl+alt+q) to set a todo.`