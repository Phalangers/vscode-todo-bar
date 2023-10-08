import { TodoBarExtension } from '../extension'
import { assert } from '../misc'
import { command_clearTodo } from './clearTodo'
import { command_setTodo } from './setTodo'


export function command_setOrClear(ext: TodoBarExtension) {
	console.log('setOrClear')
	const activeEditor = ext.editor.$

	assert(activeEditor?.document, "Open a file first")

	if (lineFocused(ext)) {
		return command_clearTodo(ext)
	} else {
		return command_setTodo(ext)
	}
}

function lineFocused(ext: TodoBarExtension) {
	if (!ext.currentTodo.$) return false
	if (!ext.editor.$) return false
	return ext.currentTodo.$.line == ext.editor.$.selection.active.line
}
