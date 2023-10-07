import * as vscode from "vscode"
import { TodoBarExtension, getParentLines } from "../extension"
import { uriToFilePath } from "../misc"
import { formatText } from "../status-bar"
import { addPrefixesEdits, removePrefixesEdits } from "../text-edits"

export async function command_setTodo(ext: TodoBarExtension) {
	console.log('setTodo')
	const activeEditor = ext.activeEditor.$
	if (!activeEditor?.document) return false

	const cursorLine = activeEditor.selection.active.line
	const newTodo = {
		line: cursorLine,
		file: uriToFilePath(activeEditor?.document.uri)
	}
	ext.currentTodo.$ = newTodo

	ext.lines.$ = getParentLines(activeEditor, cursorLine)
	vscode.workspace.getConfiguration('todo-bar').update('todoFilePath', newTodo.file, vscode.ConfigurationTarget.Workspace)
	ext.show = true
	const text = formatText(ext.lines.$, ext.configuration.$.ignoredCharacters, ext.configuration.$.showParentTasks)
	ext.statusBar.displayInStatusBar(text)
	ext.windowTitle.set(text)

	await activeEditor.edit(editBuilder => {
		removePrefixesEdits(ext, editBuilder)
	})
	ext.lines.$ = getParentLines(activeEditor, cursorLine)
	await activeEditor.edit(editBuilder => {
		addPrefixesEdits(ext, editBuilder)
	})
	await vscode.commands.executeCommand('workbench.action.files.save')

	ext.highlights.updateThrottled()
}
