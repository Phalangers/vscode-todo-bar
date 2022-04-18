import * as vscode from 'vscode'

export function indentationLevel(line: vscode.TextLine) {
	let res = 0
	for (let i = 0; i < line.text.length; i++) {
		if (line.text[i] == '\t' || line.text[i] == ' ') {
			res++
		} else {
			break
		}
	}
	return res
}

export function removeLeadingChars(text: string, symbols: string[] = [' ', '-']): string {
	let i = 0
	for (; i < symbols.length; i++) {
		if (!symbols.includes(text[i])) {
			break
		}
	}
	return text.slice(i)
}
