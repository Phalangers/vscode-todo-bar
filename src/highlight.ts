import { effect } from 'ng-signals'
import * as vscode from 'vscode'
import { Disposable } from 'vscode'
import { TodoBarExtension } from './extension'
import { firstIndexNot, uriToFilePath } from './misc'

/**
 * Handles highlighting the selected lines
 */
export class Highlights {

  decorationType: vscode.TextEditorDecorationType
  secondaryDecorationType: vscode.TextEditorDecorationType
  timeout: NodeJS.Timeout | null = null
  subscriptions: Disposable[] = []

  constructor(public ext: TodoBarExtension) {
    this.decorationType = vscode.window.createTextEditorDecorationType({
      backgroundColor: { id: 'todobar.highlightColor' },
      fontStyle: 'italic',
    })

    this.secondaryDecorationType = vscode.window.createTextEditorDecorationType({
      backgroundColor: { id: 'todobar.secondaryHighlightColor' },
    })

    vscode.workspace.onDidChangeTextDocument(event => {
      const activeEditor = this.ext.activeEditor.$
      if (activeEditor && event.document === activeEditor.document) {
        this.updateThrottled()
      }
    }, null, this.subscriptions)

    effect(() => this.updateThrottled())
  }

  updateThrottled() {
    if (this.timeout) {
      clearTimeout(this.timeout)
      this.timeout = null
    }
    this.timeout = setTimeout(() => {
      this.update()
    }, 20)
  }

  private update() {
    if (!this.ext.currentTodo.$) return
    if (!this.ext.activeEditor.$) return

    if (
      this.ext.show &&
      this.ext.lines.length > 0 &&
      this.ext.currentTodo.$.file == uriToFilePath(this.ext.activeEditor.$.document.uri)
    ) {
      this.ext.activeEditor.$.setDecorations(this.decorationType, [
        lineToHighlightRange(this.ext.lines[0], this.ext.configuration.$.ignoredCharacters),
      ])
      if (this.ext.configuration.$.showParentTasks) {
        this.ext.activeEditor.$.setDecorations(
          this.secondaryDecorationType,
          this.ext.lines.slice(1).map(line => lineToHighlightRange(line, this.ext.configuration.$.ignoredCharacters))
        )
      }
    }
  }

  clear() {
    this.ext.activeEditor.$?.setDecorations(this.decorationType, [])
    this.ext.activeEditor.$?.setDecorations(this.secondaryDecorationType, [])
  }

  dispose() {
    this.subscriptions.forEach(sub => sub.dispose())
  }

}

/**
 * Returns a range from after the ignoredCharacters til the end of the line.
 */
function lineToHighlightRange(line: vscode.TextLine, ignoredCharacters: string) {
  const startIndex = firstIndexNot(line.text, ignoredCharacters)
  return new vscode.Range(line.range.start.translate(0, startIndex), line.range.end)
}
