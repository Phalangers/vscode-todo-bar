import * as vscode from 'vscode'
import { highlight } from './highlight'
import { indentationLevel, removeLeadingChars } from './misc'

const state = {
	configuration: {
		showParentTasks: false,
	},
	context: null as vscode.ExtensionContext,
	activeEditor: vscode.window.activeTextEditor,

	show: true,
	lines: [] as vscode.TextLine[],
	uri: null as vscode.Uri,

	statusBarItem: null as vscode.StatusBarItem,
	decorationType: null as vscode.TextEditorDecorationType,
	secondaryDecorationType: null as vscode.TextEditorDecorationType,
	timeout: null as NodeJS.Timer,
}
export type State = typeof state

export function activate(context: vscode.ExtensionContext) {

	fetchConfiguration(state)
	state.context = context
	vscode.window.onDidChangeActiveTextEditor(editor => {
		state.activeEditor = editor
	}, null, context.subscriptions)

	// Create status-bar
	state.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0,)
	state.statusBarItem.name = 'todo-bar'
	state.statusBarItem.command = 'todo-bar.clear'
	state.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground')
	state.statusBarItem.hide()

	// Register commands
	const disposable1 = vscode.commands.registerCommand('todo-bar.set-todo', commands.setTodo)
	const disposable2 = vscode.commands.registerCommand('todo-bar.clear', commands.clearTodo)
	const disposable3 = vscode.commands.registerCommand('todo-bar.smart', commands.smart)
	const disposable4 = vscode.commands.registerCommand('todo-bar.jump-to-file', commands.jumpToFile)

	// Listen to changes
	vscode.workspace.onDidChangeConfiguration(() => {
		fetchConfiguration(state)
		displayInStatusBar(formatText(state.lines))
	}, null, context.subscriptions)

	highlight.setup(state)

	context.subscriptions.push(state.statusBarItem, state.decorationType, disposable1, disposable2, disposable3, disposable4,)
}

function fetchConfiguration(state: State) {
	state.configuration = vscode.workspace.getConfiguration('todo-bar') as unknown as typeof state.configuration
}

namespace commands {

	export function smart() {
		if (!state.activeEditor?.document) return

		// Jump to file
		if (state.uri && state.uri.toString() != state.activeEditor?.document.uri.toString()) {
			jumpToFile()
			return
		}

		fetchLines(state)

		if (formatText(state.lines) == state.statusBarItem.text) {
			clearTodo()
			return
		}

		setTodo()
	}

	export function setTodo() {
		if (!state.activeEditor?.document) return

		fetchLines(state)
		state.uri = state.activeEditor?.document.uri
		state.show = true
		const text = formatText(state.lines)
		displayInStatusBar(text)
		highlight.updateHighlight(state)
	}

	export function clearTodo() {
		state.show = false
		state.uri = null
		state.statusBarItem.text = ''
		state.statusBarItem.hide()
		highlight.clear(state)
	}

	export function jumpToFile() {
		if (!state.uri) {
			throw new Error('No file to jump to')
		}

		vscode.workspace.openTextDocument(state.uri).then(doc => {
			vscode.window.showTextDocument(doc).then(() => {
				if (doc.getText().length == 0) {
					vscode.commands.executeCommand('workbench.action.closeActiveEditor')
					throw new Error('Untitled file containing the todo has been lost')
				}
			})
		})

	}

}

function formatText(lines: vscode.TextLine[]): string {

	if (state.configuration.showParentTasks) {
		return lines.map(line => line.text.trim())
			.map(line => removeLeadingChars(line))
			.reverse()
			.filter(line => line.length > 0)
			.join(' ⇒ ')
	} else {
		return removeLeadingChars(lines[lines.length - 1].text.trim())
	}
}

// Reads the current line from the document, then read upwards to find its parent lines (less indented)
function fetchLines(state: State) {
	let lines = []
	let currentIndentationLevel = 999
	for (let i = state.activeEditor.selection.active.line; i >= 0; i--) {
		const line = state.activeEditor?.document.lineAt(i)
		if (line.text.trim().length == 0) {
			if (lines.length == 0) {
				throw new Error('Invalid line')
			} else {
				continue
			}
		}
		if (indentationLevel(line) < currentIndentationLevel) {
			currentIndentationLevel = indentationLevel(line)
			lines.push(line)
		}
	}
	state.lines = lines
}

function displayInStatusBar(text: string) {
	state.statusBarItem.text = text
	state.statusBarItem.tooltip = text
	state.statusBarItem.show()
}

export function deactivate() { }

