import fs from 'fs';
import { drawClasses } from './draw';

function getFileContent(file: string) {
	let contents;
	try {
		contents = fs.readFileSync(file).toString();
	} catch (e) {
		console.error('error while reading file:', e);
		contents = null;
	}
	return contents;
}

const fileContent = getFileContent('../Airline/src/Airline.ts');
// const fileContent = getFileContent('src/index.ts');

let counter: number = 0;
let wordStart: number = 0;
let wordEnd: number = 0;
let lastWord: string = '';
let currentContext: string = 'file';
const lastVisibilityOperator: string[] = [];

const classBrackets: string[] = [];

const classes: {
	name: string;
	parentclasses: string[];
	methods: { visibility: string; returnType: string; fn: string }[];
	attributes: { visibility: string; name: string; type: string }[];
}[] = [];

while (counter < fileContent!.length) {
	if (isIndentation(fileContent!, counter)) {
		if (wordStart < wordEnd) {
			lastWord = handleWord(lastWord);
		}
		counter++;
		wordStart = counter;
	} else {
		counter++;
		wordEnd = counter;
	}
}

function isIndentation(s: string, index: number) {
	return (
		s[index] === ' ' ||
		s[index] === '\n' ||
		s[index] === '\r' ||
		s[index] === '\r\n'
	);
}

function handleWord(lastWord: string): string {
	const currentWord = fileContent!.substring(wordStart, wordEnd);
	if (currentWord === 'import') {
		counter = Math.min(
			fileContent!.indexOf('\n', counter),
			fileContent!.indexOf(';', counter),
		);
	} else if (currentWord === 'export') {
		// do nothing
	} else if (currentWord === 'class') {
		currentContext = 'class';
		const classBracketIndex: number = fileContent!.indexOf('{', counter);
		const withoutClassKeyword = fileContent!
			.substring(counter, classBracketIndex)
			.trim();
		const className: string = withoutClassKeyword
			.substring(0, withoutClassKeyword.indexOf(' '))
			.trim();
		const parents: string[] = [];
		const implKeywordIndex = withoutClassKeyword.indexOf(
			' ',
			className.length + 1,
		);
		parents.push(
			...withoutClassKeyword.substring(implKeywordIndex).trim().split(','),
		);

		classBrackets.push('{');
		counter = classBracketIndex;

		classes.push({
			name: className,
			parentclasses: parents,
			methods: [],
			attributes: [],
		});
	}
	// single-line comment
	else if (currentWord === '//') {
		counter = fileContent!.indexOf('\n', counter);
	}
	// multi-line comment
	else if (currentWord === '/*') {
		counter = fileContent!.indexOf('*/');
	}
	// -> if current Word points to a function/method
	else if (
		(currentWord!.includes('(') || currentWord === '(') &&
		!currentWord!.includes('Error')
	) {
		let word = '';
		if (currentWord === '(') {
			word =
				lastWord +
				fileContent!
					.substring(
						counter - currentWord.length,
						Math.min(
							fileContent!.indexOf('{', counter - currentWord.length),
							fileContent!.indexOf(';', counter - currentWord.length),
						),
					)
					.replace(/\n/g, '')
					.replace(/ /g, '');
			word = word.trim();

			// console.log(word);
			counter = Math.min(
				fileContent!.indexOf('{', counter - currentWord.length),
				fileContent!.indexOf(';', counter - currentWord.length),
			);
		} else if (currentWord!.includes('(')) {
			let newCounter = Math.min(
				Math.max(
					fileContent!.indexOf('{', counter - currentWord.length),
					counter,
				),
				Math.max(
					fileContent!.indexOf(';', counter - currentWord.length),
					counter,
				),
			);
			word =
				' ' +
				fileContent!
					.substring(counter - currentWord.length, newCounter)
					.trim()
					.replace(/\n/g, '')
					.replace(/ /g, '');
			word = word.trim();

			if (fileContent![newCounter] === '{') {
				newCounter = getClosingBracket(newCounter + 1);
			}
			counter = newCounter;
		}

		let returnType: string = '';
		let returnTypeIndex: number = word.length;
		if (word.substring(word.lastIndexOf(')') + 1).includes(':')) {
			returnType = word.substring(word.lastIndexOf(')') + 2);
			returnTypeIndex = word.lastIndexOf(returnType) - 1;
		}
		if (currentContext === 'class') {
			classes[classes.length - 1].methods.push({
				visibility: lastVisibilityOperator.pop() ?? '',
				returnType: returnType,
				fn: word.substring(0, returnTypeIndex),
			});
		}
	} else if (currentWord === 'private' || currentWord === 'public') {
		if (lastWord === 'static') {
			lastVisibilityOperator.push(lastWord + ' ' + currentWord);
		} else {
			lastVisibilityOperator.push(currentWord);
		}
	} else if (currentContext === 'class') {
		if (!(currentWord === '{' || currentWord === '}')) {
			let varEnd = Math.min(
				Math.max(
					fileContent!.indexOf('\n', counter - currentWord.length),
					counter,
				),
				Math.max(
					fileContent!.indexOf(';', counter - currentWord.length),
					counter,
				),
			);
			let word = fileContent!.substring(
				counter - currentWord.length,
				varEnd + 1,
			);
			word = word.trim();

			classes[classes.length - 1].attributes.push({
				visibility: lastVisibilityOperator.pop()!,
				name: word.substring(0, word.indexOf(' ')).trim().replace(':', ''),
				type: word.substring(word.indexOf(':') + 1).trim(),
			});
			counter = varEnd + 1;
		} else {
			if (currentWord === '{') {
				classBrackets.push('{');
			} else {
				classBrackets.pop();
				if (!classBrackets.length) currentContext = 'file';
			}
		}
	} else {
		console.log(currentWord);
	}
	return currentWord;
}

function getClosingBracket(index: number): number {
	let brackArr: string[] = ['{'];
	while (brackArr.length) {
		if (fileContent![index] === '{') {
			brackArr.push('{');
		} else if (fileContent![index] === '}') {
			brackArr.pop();
		}
		index++;
	}
	return index;
}

console.log('classes-Array: ', classes);

drawClasses(classes);
