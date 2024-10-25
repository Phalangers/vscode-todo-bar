import * as vscode from 'vscode'
import { command_clearTodo } from './commands/clearTodo'
import { command_jumpBackAndForth } from './commands/jumpBackAndForth'
import { command_jumpToFile } from './commands/jumpToFile'
import { command_setOrClear } from './commands/setOrClear'
import { command_setTodo } from './commands/setTodo'
import { Highlights } from './highlight'
import { findMarkedLine, measureIndentation, signal } from './misc'
import { StatusBar } from './status-bar'
import { WindowTitle } from './window-title'
import { effect } from 'ng-signals'

export class TodoBarExtension {
  configuration = signal(fetchConfiguration() as Configuration)

  enabled = true
  currentTodo = signal<TodoLocation>(null);
  activeEditor = signal(vscode.window.activeTextEditor)
  parentLines = signal<vscode.TextLine[]>([])

  statusBar: StatusBar
  highlights: Highlights
  windowTitle: WindowTitle

  constructor(public context: vscode.ExtensionContext) {

    vscode.workspace.onDidChangeConfiguration(() => {
      this.configuration.$ = fetchConfiguration()
    }, null, context.subscriptions)

    vscode.window.onDidChangeActiveTextEditor(editor => {
      this.activeEditor.$ = editor
    }, null, context.subscriptions)

    vscode.workspace.onDidChangeTextDocument(event => {
      if (!this.currentTodo.$) return
      const activeEditor = this.activeEditor.$
      if (activeEditor && event.document === activeEditor.document) {
        this.currentTodo.$.line = findMarkedLine(activeEditor.document, this.configuration.$)
        this.currentTodo.changed()
      } else {
        debugger
      }
    }, null, context.subscriptions)

    effect(() => {
      console.log('currentTodoUri: ' + this.currentTodo()?.fileUri)
    })

    this.statusBar = new StatusBar(this.configuration)
    this.windowTitle = new WindowTitle()
    this.highlights = new Highlights(this)

    const commands = [
      vscode.commands.registerCommand('todo-bar.set', () => command_setTodo(this)),
      vscode.commands.registerCommand('todo-bar.clear', () => command_clearTodo(this)),
      vscode.commands.registerCommand('todo-bar.set-or-clear', () => command_setOrClear(this)),
      vscode.commands.registerCommand('todo-bar.jump-to-file', () => command_jumpToFile(this)),
      vscode.commands.registerCommand('todo-bar.jump-back-and-forth', () => command_jumpBackAndForth(this)),
    ]

    context.subscriptions.push(...commands)
  }

  dispose() {
    this.windowTitle.restore()
  }
}

const configurationExample = {
  showParentTasks: true,
  lightMark: '>',
  mark: '>',
  ignoredCharacters: " \t-",
  todoFilePath: null as string | null,
}

export type Configuration = typeof configurationExample

export type TodoLocation = {
  fileUri: vscode.Uri
  line: number | null
} | null


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


/**
* Reads the current line,
* Then reads upwards to find its parent lines (less indentation)
*/
export function getParentLines(document: vscode.TextDocument, lineNb: number) {
  let lines = []
  let currentIndentationLevel = 999
  for (let i = lineNb; i >= 0; i--) {
    const line = document.lineAt(i)
    if (line.isEmptyOrWhitespace) {
      continue
    }
    const indentation = measureIndentation(line.text, " \t")
    if (indentation < currentIndentationLevel) {
      currentIndentationLevel = indentation
      lines.push(line)
    }
  }
  return lines
}
