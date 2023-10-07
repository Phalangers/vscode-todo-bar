import * as vscode from "vscode"
import { TodoBarExtension } from "../extension"
import { uriToFilePath } from "../misc"
import { formatText } from "../status-bar"
import { addPrefixesEdits, removePrefixesEdits } from "../text-edits"

export async function command_setTodo(ext: TodoBarExtension) {
	console.log('setTodo')
	const activeEditor = ext.activeEditor.$
	if (!activeEditor?.document) return false

	const newTodo = {
		line: activeEditor.selection.active.line,
		file: uriToFilePath(activeEditor?.document.uri)
	}
	ext.currentTodo.$ = newTodo

	ext.lines = ext.getParentLines(activeEditor)
	vscode.workspace.getConfiguration('todo-bar').update('todoFilePath', newTodo.file, vscode.ConfigurationTarget.Workspace)
	ext.show = true
	const text = formatText(ext.lines, ext.configuration.$.ignoredCharacters, ext.configuration.$.showParentTasks)
	ext.statusBar.displayInStatusBar(text)
	ext.windowTitle.set(text)

	await activeEditor.edit(editBuilder => {
		removePrefixesEdits(ext, editBuilder)
	})
	ext.lines = ext.getParentLines(activeEditor)
	await activeEditor.edit(editBuilder => {
		addPrefixesEdits(ext, editBuilder)
	})
	await vscode.commands.executeCommand('workbench.action.files.save')

	ext.highlights.updateThrottled()
}
