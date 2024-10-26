import * as vscode from "vscode"
import { TodoBarExtension } from "../extension"
import { removeMarkEdit } from "../text-edits"


export async function command_clearTodo(ext: TodoBarExtension) {
	console.log('clearTodo')

	ext.enabled = false
	ext.currentTodo.$ = null
	vscode.workspace.getConfiguration('todo-bar').update('todoFilePath', null, vscode.ConfigurationTarget.WorkspaceFolder)

	ext.windowTitle.restore()

	const activeEditor = ext.activeEditor.$
	if (activeEditor) {
		await activeEditor.edit(editBuilder => {
			removeMarkEdit(ext, editBuilder)
		})

		ext.highlights.clear()
	}
}
