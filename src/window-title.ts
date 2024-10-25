import * as vscode from 'vscode'

export class WindowTitle {

	windowConfig = vscode.workspace.getConfiguration('window')
	previousWindowTitle = this.windowConfig.get('title')

	set(title: string) {
		this.windowConfig.update('title', title, vscode.ConfigurationTarget.WorkspaceFolder)
	}

	restore() {
		this.windowConfig.update('title', this.previousWindowTitle, vscode.ConfigurationTarget.WorkspaceFolder)
	}
}
