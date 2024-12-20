import * as vscode from "vscode"
import { TodoBarExtension, TodoLocation, getParentLines } from "../extension"
import { formatText } from "../status-bar"
import { addMarkEdit, removeMarkEdit, } from "../text-edits"

export async function command_setTodo(ext: TodoBarExtension) {
	console.log('setTodo')
	const activeEditor = ext.activeEditor.$
	if (!activeEditor?.document) return false

	const cursorLine = activeEditor.selection.active.line
	const newTodo: TodoLocation = {
		line: cursorLine,
		filePath: activeEditor?.document.uri.fsPath,
	}
	ext.currentTodo.$ = newTodo

	ext.parentLines.$ = getParentLines(activeEditor.document, cursorLine)
	vscode.workspace.getConfiguration('todo-bar').update('todoFilePath', newTodo.filePath, vscode.ConfigurationTarget.WorkspaceFolder)
	ext.enabled = true
	const text = formatText(ext.parentLines.$, ext.configuration.$.ignoredCharacters, ext.configuration.$.showParentTasks)
	ext.statusBar.displayInStatusBar(text)
	ext.windowTitle.set(text)

	await activeEditor.edit(editBuilder => {
		removeMarkEdit(ext, editBuilder)
	})
	ext.parentLines.$ = getParentLines(activeEditor.document, cursorLine)
	await activeEditor.edit(editBuilder => {
		addMarkEdit(ext, editBuilder)
	})
	await vscode.commands.executeCommand('workbench.action.files.save')

	ext.highlights.updateThrottled()
}
