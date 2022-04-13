import * as vscode from 'vscode'

let settings: {
	showParentTasks: boolean,
}

let state: {
	statusBarItem: vscode.StatusBarItem,
} = {
	statusBarItem: null,
}

export function activate(context: vscode.ExtensionContext) {

	// Fetch settings
	settings = vscode.workspace.getConfiguration('todo-bar') as unknown as typeof settings

	// Create statusBarItem
	state.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0,)
	state.statusBarItem.name = 'todo-bar'
	state.statusBarItem.command = 'todo-bar.clear'
	state.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground')
	state.statusBarItem.hide()

	// Register commands
	let disposable1 = vscode.commands.registerCommand('todo-bar.set-todo', setTodo_Command)
	let disposable2 = vscode.commands.registerCommand('todo-bar.clear', clearTodo_Command)

	// Listen to changes
	let disposable3 = vscode.workspace.onDidChangeConfiguration(() => {
		displayTodo(state.statusBarItem.text)
	})

	context.subscriptions.push(disposable1, disposable2, disposable3, state.statusBarItem)
}

function setTodo_Command() {
	const activeEditor = vscode.window.activeTextEditor
	if (activeEditor) {
		const text = fetchTodoText(activeEditor)
		if (text == state.statusBarItem.text) {
			clearTodo_Command()
		} else {
			displayTodo(text)
		}
	}
}

function clearTodo_Command() {
	state.statusBarItem.text = ''
	state.statusBarItem.hide()
}

// Reads the selected line from the document, and optionally the parent tasks
function fetchTodoText(activeEditor: vscode.TextEditor): string {
	let lines: vscode.TextLine[] = []
	if (settings.showParentTasks) {
		lines = fetchParentLines(activeEditor.document, activeEditor.selection.active.line)
	} else {
		lines = [activeEditor.document.lineAt(activeEditor.selection.active.line)]
	}
	return lines
		.map(line => line.text.trim())
		.map(line => removeLeadingChars(line, [' ', '-']))
		.reverse()
		.join(' -> ')
}

function removeLeadingChars(text: string, symbols: string[]): string {
	let i = 0
	for (; i < symbols.length; i++) {
		if (!symbols.includes(text[i])) {
			break
		}
	}
	return text.slice(i)
}

function fetchParentLines(document: vscode.TextDocument, mainLineNumber: number): vscode.TextLine[] {
	let lines = []
	let currentIndentationLevel = 999
	for (let i = mainLineNumber; i >= 0; i--) {
		const line = document.lineAt(i)
		const lineIndentationLevel = indentationLevel(line)
		if (lineIndentationLevel < currentIndentationLevel) {
			currentIndentationLevel = lineIndentationLevel
			lines.push(line)
		}
	}
	return lines
}

function indentationLevel(line: vscode.TextLine) {
	let res = 0
	for (let i = 0; i < line.text.length; i++) {
		if (line.text[i] == '\t') {
			res++
		} else {
			break
		}
	}
	return res
}

function displayTodo(text: string) {
	state.statusBarItem.text = text
	state.statusBarItem.tooltip = text
	state.statusBarItem.show()
}

export function deactivate() { }

