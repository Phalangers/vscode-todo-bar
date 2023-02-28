import * as vscode from 'vscode'
import { highlight } from './highlight'
import { indentationLevel, removeLeadingChars } from './misc'

const state = {
  configuration: {
    showParentTasks: false,
  },
  extensionContext: null as vscode.ExtensionContext,
  activeEditor: vscode.window.activeTextEditor,

  show: true,
  lines: [] as vscode.TextLine[],
  uri: null as vscode.Uri,
  line: null as number,

  statusBarItem: null as vscode.StatusBarItem,
  decorationType: null as vscode.TextEditorDecorationType,
  secondaryDecorationType: null as vscode.TextEditorDecorationType,
  timeout: null as NodeJS.Timer,

  windowConfig: {} as any,
  oldWindowTitle: '',
}
export type State = typeof state

export function activate(context: vscode.ExtensionContext) {
  fetchConfiguration(state)
  state.extensionContext = context

  // Create status-bar
  state.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0)
  state.statusBarItem.name = 'todo-bar'
  state.statusBarItem.command = 'todo-bar.jump-to-file'
  state.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground')
  state.statusBarItem.hide()

  // Register commands
  const disposable1 = vscode.commands.registerCommand('todo-bar.set', commands.setTodo)
  const disposable2 = vscode.commands.registerCommand('todo-bar.clear', commands.clearTodo)
  const disposable3 = vscode.commands.registerCommand('todo-bar.set-or-clear', commands.setOrClear)
  const disposable4 = vscode.commands.registerCommand('todo-bar.jump-to-file', commands.jumpToFile)
  const disposable5 = vscode.commands.registerCommand(
    'todo-bar.jump-back-and-forth',
    commands.jumpBackAndForth
  )

  // Configuration changes
  vscode.workspace.onDidChangeConfiguration(
    () => {
      fetchConfiguration(state)
      displayInStatusBar(formatText(state.lines))
    },
    null,
    context.subscriptions
  )

  // Editor changes
  vscode.window.onDidChangeActiveTextEditor(
    editor => {
      state.activeEditor = editor
    },
    null,
    context.subscriptions
  )
  highlight.setup(state)

  state.windowConfig = vscode.workspace.getConfiguration('window')
  state.oldWindowTitle = state.windowConfig.get('title')

  context.subscriptions.push(
    state.statusBarItem,
    state.decorationType,
    disposable1,
    disposable2,
    disposable3,
    disposable4,
    disposable5
  )
}

function fetchConfiguration(state: State) {
  state.configuration = vscode.workspace.getConfiguration(
    'todo-bar'
  ) as unknown as typeof state.configuration
}

namespace commands {
  export function smart() {
    // EITHER jump to file
    if (state.uri) {
      if (state.uri.toString() != state.activeEditor?.document.uri.toString()) {
        jumpToFile()
        return
      }
    }

    if (!state.activeEditor?.document) return
    fetchLines(state)

    // OR close todo file
    if (formatText(state.lines) == state.statusBarItem.text) {
      vscode.commands.executeCommand('workbench.action.closeActiveEditor')
      return
    }
  }

  export function jumpBackAndForth() {
    if (!state.uri) return

    // Right file ?
    if (state.uri.toString() == state.activeEditor?.document.uri.toString()) {
      // Right line ?
      if (state.activeEditor.selection.active.line == state.lines[0].lineNumber) {
        vscode.commands.executeCommand('workbench.action.closeActiveEditor')
      } else if (state.lines.length > 0) {
        return jumpToLine(state.lines[0])
      }
    } else {
      return jumpToFile()
    }
  }

  export function setTodo() {
    if (!state.activeEditor?.document) return

    fetchLines(state)
    state.uri = state.activeEditor?.document.uri
    state.show = true
    const text = formatText(state.lines)
    displayInStatusBar(text)
    setWindowTitle(state, text)
    highlight.updateHighlight(state)
  }

  export function setOrClear() {
    if (!state.activeEditor?.document) return
    fetchLines(state)

    if (formatText(state.lines) != state.statusBarItem.text) {
      return setTodo()
    } else {
      return clearTodo()
    }
  }

  export function clearTodo() {
    state.show = false
    state.uri = null
    state.statusBarItem.text = ''
    state.statusBarItem.hide()
    restoreWindowTitle(state)
    highlight.clear(state)
  }

  export function jumpToFile() {
    if (!state.uri) {
      throw new Error('No file to jump to')
    }

    vscode.workspace.openTextDocument(state.uri).then(doc => {
      vscode.window.showTextDocument(doc).then(() => {
        if (doc.getText().length == 0) {
          vscode.commands.executeCommand('workbench.action.closeActiveEditor')
          throw new Error('Untitled file containing the todo has been lost')
        }

        if (state.lines?.length > 0) {
          jumpToLine(state.lines[0])
        }
      })
    })
  }
}

function setWindowTitle(state: State, title: string) {
  state.windowConfig.update('title', title, false)
}

function restoreWindowTitle(state: State) {
  state.windowConfig.update('title', state.oldWindowTitle, false)
}

export function jumpToLine(line: vscode.TextLine) {
  let cursorPosition = line.range.end
  let selection = new vscode.Selection(cursorPosition, cursorPosition)
  state.activeEditor.selection = selection
  state.activeEditor.revealRange(line.range)
}

function formatText(lines: vscode.TextLine[]): string {
  const cleanLines = lines
    .map(line => line.text.trim())
    .map(line => removeLeadingChars(line))
    .reverse()
    .filter(line => line.length > 0)

  if (state.configuration.showParentTasks) {
    return cleanLines.join(' ⇒ ')
  } else {
    return cleanLines[cleanLines.length - 1]
  }
}

// Reads the current line from the document, then read upwards to find its parent lines (less indented)
function fetchLines(state: State) {
  let lines = []
  let currentIndentationLevel = 999
  for (let i = state.activeEditor.selection.active.line; i >= 0; i--) {
    const line = state.activeEditor?.document.lineAt(i)
    if (line.text.trim().length == 0) {
      if (lines.length == 0) {
        throw new Error('Line is empty')
      } else {
        continue
      }
    }
    if (indentationLevel(line) < currentIndentationLevel) {
      currentIndentationLevel = indentationLevel(line)
      lines.push(line)
    }
  }
  state.lines = lines
}

function displayInStatusBar(text: string) {
  state.statusBarItem.text = text
  state.statusBarItem.tooltip = text
  state.statusBarItem.show()
}

export function deactivate() {
  state.windowConfig.update('title', state.oldWindowTitle, false)
}
