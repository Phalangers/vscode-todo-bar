import { TodoBarExtension } from '../extension'
import { assert } from '../misc'
import { command_clearTodo } from './clearTodo'
import { command_setTodo } from './setTodo'


export function command_setOrClear(ext: TodoBarExtension) {
	console.log('setOrClear')
	const activeEditor = ext.activeEditor.$

	assert(activeEditor?.document, "Open a file first")

	if (ext.lineFocused()) {
		return command_clearTodo(ext)
	} else {
		return command_setTodo(ext)
	}
}
