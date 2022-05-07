import * as vscode from 'vscode'
import { State } from './extension'
import { indentationLevel } from './misc'

export namespace highlight {

	export function setup(state: State) {

		state.decorationType = vscode.window.createTextEditorDecorationType({
			backgroundColor: { id: 'todobar.highlightColor' },
			fontStyle: 'italic',
		})

		state.secondaryDecorationType = vscode.window.createTextEditorDecorationType({
			backgroundColor: { id: 'todobar.secondaryHighlightColor' },
		})

		vscode.window.onDidChangeActiveTextEditor(() => {
			if (state.activeEditor.document) {
				updateHighlight(state)
			}
		}, null, state.context.subscriptions)

		vscode.workspace.onDidChangeTextDocument(event => {
			if (state.activeEditor && event.document === state.activeEditor.document) {
				state.timeout = setTimeout(() => {
					throttleUpdateHighlight(state)
				})
			}
		}, null, state.context.subscriptions)

	}

	export function throttleUpdateHighlight(state: State) {
		if (state.timeout) {
			clearTimeout(state.timeout)
			state.timeout = null
		}
		state.timeout = setTimeout(() => { updateHighlight(state) }, 100)
	}

	export function updateHighlight(state: State) {
		if (state.show && state.lines.length > 0 && state.uri.toString() == state.activeEditor.document.uri.toString()) {
			state.activeEditor.setDecorations(state.decorationType, [range_ingoreWhitespace(state.lines[0])])
			if (state.configuration.showParentTasks) {
				state.activeEditor.setDecorations(state.secondaryDecorationType, state.lines.slice(1).map(line => range_ingoreWhitespace(line)))
			}
		}
	}

	function range_ingoreWhitespace(line: vscode.TextLine) {
		const indentation = indentationLevel(line)
		return new vscode.Range(line.range.start.translate(0, indentation), line.range.end)
	}

	export function clear(state: State) {
		state.activeEditor?.setDecorations(state.decorationType, [])
		state.activeEditor?.setDecorations(state.secondaryDecorationType, [])
	}

}