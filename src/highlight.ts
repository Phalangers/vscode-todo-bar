import { effect } from 'ng-signals'
import * as vscode from 'vscode'
import { Disposable } from 'vscode'
import { Configuration, TodoBarExtension, TodoLocation, getParentLines } from './extension'
import { walkForward } from './misc'

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

    effect(() => this.updateThrottled())
  }

  updateThrottled() {
    if (this.timeout) {
      clearTimeout(this.timeout)
      this.timeout = null
    }

    const currentTodo = this.ext.currentTodo.$
    const configuration = this.ext.configuration.$
    const enabled = this.ext.enabled
    const editor = this.ext.activeEditor.$

    this.timeout = setTimeout(() => {
      this.update(editor, currentTodo, configuration, enabled)
    }, 20)
  }

  private update(activeEditor: vscode.TextEditor | undefined, currentTodo: TodoLocation, configuration: Configuration, enabled: boolean) {
    if (!currentTodo?.line) return
    if (!activeEditor) return

    const lines = getParentLines(activeEditor.document, currentTodo.line)

    if (
      enabled &&
      lines.length > 0 &&
      currentTodo.fileUri == activeEditor.document.uri
    ) {
      this.clear()
      activeEditor.setDecorations(this.decorationType, [
        lineToHighlightRange(lines[0], ' \t'),
      ])
      if (configuration.showParentTasks) {
        activeEditor.setDecorations(
          this.secondaryDecorationType,
          lines.slice(1).map(line => lineToHighlightRange(line, ' \t'))
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
  const afterIgnoredCharacters = walkForward(line.text, ignoredCharacters)
  return new vscode.Range(line.range.start.translate(0, afterIgnoredCharacters), line.range.end)
}
