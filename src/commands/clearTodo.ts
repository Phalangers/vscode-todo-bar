import * as vscode from "vscode"
import { TodoBarExtension } from "../extension"
import { removePrefixesEdits } from "../text-edits"


export async function command_clearTodo(ext: TodoBarExtension) {
	console.log('clearTodo')

	ext.show = false
	ext.currentTodo.$ = null
	vscode.workspace.getConfiguration('todo-bar').update('todoFilePath', null, vscode.ConfigurationTarget.Workspace)

	ext.windowTitle.restore()

	const activeEditor = ext.activeEditor.$
	if (activeEditor) {
		await activeEditor.edit(editBuilder => {
			removePrefixesEdits(ext, editBuilder)
		})

		ext.highlights.clear()
	}
}
