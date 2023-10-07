import * as vscode from "vscode"
import { TodoBarExtension, getParentLines } from "../extension"
import { assert, error, findMarkedLine, jumpToLine } from '../misc'


export async function command_jumpToFile(ext: TodoBarExtension) {
	console.log('jumpToFile')

	const todoFilePath = ext.configuration.$.todoFilePath
	if (todoFilePath) {
		ext.currentTodo.$ = {
			file: todoFilePath,
			line: -1
		}
	} else {
		assert(ext.currentTodo, `Use command [Set Todo] first.`)
	}

	if (!ext.currentTodo.$) return error(`Use command [Set Todo] first.`)

	const doc = await vscode.workspace.openTextDocument(ext.currentTodo.$.file)
	await vscode.window.showTextDocument(doc)

	if (doc.fileName.startsWith('Untitled-')) {
		vscode.commands.executeCommand('workbench.action.closeActiveEditor')
		throw new Error('Untitled file containing the todo has been lost')
	}

	const activeEditor = ext.activeEditor.$
	if (activeEditor) {
		if (ext.currentTodo.$.line) {
			ext.currentTodo.mutate(todo => {
				todo!.line = findMarkedLine(activeEditor.document, ext.configuration.$)
			})
			ext.lines.$ = getParentLines(activeEditor, ext.currentTodo.$.line)
		}

		if (ext.lines.$?.length > 0) {
			jumpToLine(activeEditor, ext.lines.$[0])
		}
		ext.highlights.updateThrottled()
	}

}
