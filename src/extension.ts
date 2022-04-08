import * as vscode from 'vscode'

let statusBarItem: vscode.StatusBarItem

export function activate(context: vscode.ExtensionContext) {

	statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0,)
	statusBarItem.name = 'todo-bar'
	statusBarItem.command = 'todo-bar.clear'
	statusBarItem.hide()

	// updateTheme()
	// vscode.window.onDidChangeActiveColorTheme(updateTheme)

	let disposable1 = vscode.commands.registerCommand('todo-bar.set-todo', setTodo)
	let disposable2 = vscode.commands.registerCommand('todo-bar.clear', clearTodo)

	context.subscriptions.push(disposable1, disposable2, statusBarItem)
}

function setTodo() {
	const activeEditor = vscode.window.activeTextEditor
	if (activeEditor) {
		const line = activeEditor.document.lineAt(activeEditor.selection.active.line)
		const text = line.text.trim()
		if (text == statusBarItem.text) {
			clearTodo()
		} else {
			statusBarItem.text = text
			statusBarItem.tooltip = text
			statusBarItem.show()
		}
	}
}

function clearTodo() {
	statusBarItem.text = ''
	statusBarItem.hide()
}

// function updateTheme() {
// 	const theme = vscode.window.activeColorTheme

// 	switch (theme.kind) {
// 		case vscode.ColorThemeKind.Light:
// 		case vscode.ColorThemeKind.HighContrastLight:
// 			statusBarItem.color = new vscode.ThemeColor('errorForeground')
// 			break
// 		case vscode.ColorThemeKind.Dark:
// 		case vscode.ColorThemeKind.HighContrast:
// 			statusBarItem.color = '#ffffff'
// 			break
// 	}

// }


export function deactivate() { }
