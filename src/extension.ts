import * as vscode from 'vscode'

let statusBarItem: vscode.StatusBarItem

export function activate(context: vscode.ExtensionContext) {

	statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0,)
	statusBarItem.name = 'todo-bar'
	statusBarItem.command = 'extension.clear'
	statusBarItem.hide()

	// updateTheme()
	// vscode.window.onDidChangeActiveColorTheme(updateTheme)

	let disposable1 = vscode.commands.registerCommand('extension.set-todo', setTodo)
	let disposable2 = vscode.commands.registerCommand('extension.clear', clearTodo)

	context.subscriptions.push(disposable1, disposable2, statusBarItem)
}

function setTodo() {
	const activeEditor = vscode.window.activeTextEditor
	if (activeEditor) {
		const line = activeEditor.document.lineAt(activeEditor.selection.active.line)
		statusBarItem.text = line.text.trim()
		statusBarItem.tooltip = line.text.trim()
		statusBarItem.show()
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
