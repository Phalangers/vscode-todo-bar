import * as vscode from 'vscode'
import { command_clearTodo } from './commands/clearTodo'
import { command_jumpBackAndForth } from './commands/jumpBackAndForth'
import { command_jumpToFile } from './commands/jumpToFile'
import { command_setTodo } from './commands/setTodo'
import { command_setOrClear } from './commands/setOrClear'
import { Highlights } from './highlight'
import { indentationLevel, variable } from './misc'
import { StatusBar } from './status-bar'
import { WindowTitle } from './window-title'

const configurationExample = {
  showParentTasks: false,
  lightPrefix: '>',
  prefix: '>',
  ignoredCharacters: " \t-",
  todoFilePath: null as string | null,
}

export type Configuration = typeof configurationExample

export class TodoBarExtension {
  extensionContext: vscode.ExtensionContext

  lines = [] as vscode.TextLine[]

  show = true
  currentTodo = variable<{ file: string; line: number } | null>(null);
  activeEditor = variable(vscode.window.activeTextEditor)

  statusBar: StatusBar
  highlights: Highlights
  windowTitle: WindowTitle
  configuration = variable(fetchConfiguration() as Configuration)

  constructor(context: vscode.ExtensionContext) {
    this.extensionContext = context

    vscode.workspace.onDidChangeConfiguration(() => {
      this.configuration.$ = fetchConfiguration()
    }, null, context.subscriptions)

    // Editor changes
    vscode.window.onDidChangeActiveTextEditor(editor => {
      this.activeEditor.$ = editor
    }, null, context.subscriptions)

    this.statusBar = new StatusBar(this.configuration)
    this.windowTitle = new WindowTitle()

    // Register commands
    const disposable1 = vscode.commands.registerCommand('todo-bar.set', () => command_setTodo(this))
    const disposable2 = vscode.commands.registerCommand('todo-bar.clear', () => command_clearTodo(this))
    const disposable3 = vscode.commands.registerCommand('todo-bar.set-or-clear', () => command_setOrClear(this))
    const disposable4 = vscode.commands.registerCommand('todo-bar.jump-to-file', () => command_jumpToFile(this))
    const disposable5 = vscode.commands.registerCommand('todo-bar.jump-back-and-forth', () => command_jumpBackAndForth(this))

    this.highlights = new Highlights(this)

    context.subscriptions.push(disposable1, disposable2, disposable3, disposable4, disposable5)
  }

  /**
  * Reads the current line,
  * Then reads upwards to find its parent lines (less indentation)
  */
  getParentLines(activeEditor: vscode.TextEditor) {
    let lines = []
    let currentIndentationLevel = 999
    for (let i = this.currentTodo.$!.line; i >= 0; i--) {
      const line = activeEditor.document.lineAt(i)
      if (line.isEmptyOrWhitespace) {
        if (lines.length == 0) {
          throw new Error('Line is empty')
        } else {
          continue
        }
      }
      if (indentationLevel(line, " \t") < currentIndentationLevel) {
        currentIndentationLevel = indentationLevel(line, " \t")
        lines.push(line)
      }
    }
    return lines
  }

  lineFocused() {
    if (!this.currentTodo.$) return false
    if (!this.activeEditor.$) return false
    return this.currentTodo.$.line == this.activeEditor.$.selection.active.line
  }

  dispose() {
    this.windowTitle.restore()
  }
}



let extension: TodoBarExtension

export function activate(context: vscode.ExtensionContext) {
  extension = new TodoBarExtension(context)
}

export function deactivate() {
  extension.dispose()
}

function fetchConfiguration(): Configuration {
  return vscode.workspace.getConfiguration('todo-bar') as any
}
