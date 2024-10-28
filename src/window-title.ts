import * as vscode from 'vscode'

export class WindowTitle {

	windowConfig = vscode.workspace.getConfiguration('window')

	set(title: string) {
		this.windowConfig.update('title', title, vscode.ConfigurationTarget.WorkspaceFolder)
	}

	restore() {
		this.windowConfig.update('title', undefined)
	}
}
