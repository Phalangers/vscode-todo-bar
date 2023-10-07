import * as vscode from "vscode"
import { TodoBarExtension } from "./extension"
import { removeLeadingChars } from "./misc"

export class StatusBar {
	statusBarItem: vscode.StatusBarItem

	constructor(public configuration: TodoBarExtension['configuration']) {
		this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0)
		this.statusBarItem.name = 'todo-bar'
		this.statusBarItem.command = 'todo-bar.jump-to-file'
		this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground')
		this.statusBarItem.hide()
	}

	displayInStatusBar(text: string) {
		this.statusBarItem.text = text
		this.statusBarItem.tooltip = text
		this.statusBarItem.show()
	}

	hide() {
		this.statusBarItem.text = ''
		this.statusBarItem.hide()
	}
}

/**
 * Formats the text to be displayed in the status bar and window title
 */
export function formatText(lines: readonly vscode.TextLine[], ignoredCharacters: string, showParentTasks: boolean): string {
	const cleanLines = lines
		.map(line => line.text.trim())
		.map(line => removeLeadingChars(line, ignoredCharacters))
		.reverse()
		.filter(line => line.length > 0)

	if (showParentTasks) {
		return cleanLines.join(' ⇒ ')
	} else {
		return cleanLines[cleanLines.length - 1]
	}
}

