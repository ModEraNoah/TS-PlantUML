import fs from 'fs';
import { drawClasses } from './draw';
import { isMethodSignature } from 'typescript';

function getFilesOfDir(dir: string): string[] | undefined {
	let dirContent;
	try {
		dirContent = fs
			.readdirSync(dir, { withFileTypes: true })
			.map((item: any) => {
				if (!item.isDirectory()) {
					// getFilesOfDir(item.name);
					// return item;
					if (
						item.name.endsWith('.ts') &&
						!item.name.includes('DAO') &&
						!item.name.includes('Connector')
					)
						return item.path + item.name;
					return;
				} else {
					let res = getFilesOfDir(item.path + item.name)!;
					res = res.map((it: any) => {
						return (
							item.path +
							item.name +
							'/' +
							it.substring((item.path + item.name).length)
						);
					});
					return res;
				}
				// console.log(item);
			})
			.filter((item) => item);
	} catch (e) {
		console.error('error while reading dictionary');
	}
	return dirContent?.flat();
}

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

// const fileContent = getFileContent('../Airline/src/Airline.ts');

const dirToScan: string = '../Airline/src/';

const tsFiles = getFilesOfDir(dirToScan)!;
console.log('tsfiles: ', tsFiles);

let fileContent = '';

tsFiles.forEach((file) => {
	fileContent += getFileContent(file);
	fileContent += '\n';
});

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

const functions: {
	name: string;
	returnType: string;
	functionParams: string;
}[] = [];

const variables: {
	name: string;
	type: string;
}[] = [];

while (counter < fileContent!.length) {
	if (isIndentation(fileContent!, counter)) {
		if (wordStart < wordEnd) {
			//lastWord = handleWord(lastWord);
			const currentWord = fileContent!.substring(wordStart, wordEnd);
			const currentWordType = getWordType(currentWord);
			handleWord(currentWordType, currentWord, lastWord);
			lastWord = currentWord;
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

function getWordType(currentWord: string): string {
	if (currentWord === 'import') return 'import';
	if (currentWord === 'export') return 'export';
	if (currentWord === 'class') return 'class';
	if (currentWord === 'function') return 'function';
	if (currentWord === '//') return 'slComment';
	if (currentWord === '*/') return 'mlComment';
	if (
		currentWord === 'public' ||
		currentWord === 'private' ||
		currentWord === 'protected'
	)
		return 'accessModifiers';
	if (currentWord.includes('Error')) return 'error';
	if (currentWord === 'var' || currentWord === 'const' || currentWord === 'let')
		return 'variable';
	if (
		(currentWord === '(' || currentWord.includes('(')) &&
		currentContext === 'class'
	)
		return 'method';
	if (currentWord === 'new') return 'object';
	return 'unknown';
}

function handleWord(
	currentWordType: string,
	currentWord: string,
	lastWord: string,
): void {
	if (currentWordType === 'import' || currentWordType === 'error') {
		counter = Math.min(
			fileContent!.indexOf('\n', counter),
			fileContent!.indexOf(';', counter),
		);
	} else if (currentWordType === 'slComment') {
		counter = fileContent!.indexOf('\n', counter);
	} else if (currentWordType === 'mlConnent') {
		counter = fileContent!.indexOf('*/');
	} else if (currentWordType === 'accessModifiers') {
		if (lastWord === 'static') {
			lastVisibilityOperator.push(lastWord + ' ' + currentWord);
		} else {
			lastVisibilityOperator.push(currentWord);
		}
	} else if (currentWordType === 'unknown' && currentContext === 'class') {
		if (currentWord === '{') {
			classBrackets.push('{');
			return;
		}
		if (currentWord === '}') {
			classBrackets.pop();
			if (!classBrackets.length) currentContext = 'file';
			return;
		}

		const nextNewlineIndex = fileContent!.indexOf('\n', counter);
		const nextSemicolonIndex = fileContent!.indexOf(';', counter);
		const attributeEndIndex = Math.max(
			Math.min(Math.max(nextNewlineIndex, 0), Math.max(nextSemicolonIndex, 0)),
			counter,
		);
		const wholeAttribute = fileContent!.substring(
			counter - currentWord.length,
			attributeEndIndex,
		);

		const visibility = lastVisibilityOperator.pop()!;
		const attributeName: string = wholeAttribute.split('=')[0].split(':')[0];
		let attributeType: string | undefined = wholeAttribute
			.split('=')[0]
			.split(':')[1];
		if (!attributeType) attributeType = 'any';

		classes[classes.length - 1].attributes.push({
			visibility: visibility,
			name: attributeName.trim(),
			type: attributeType!.trim(),
		});
		counter = attributeEndIndex + 1;
	} else if (currentWordType === 'method') {
		let returnType: string = '';
		let methodNameAndParams: string = '';

		const methodBracketIndex = fileContent!.indexOf('{', counter);
		let methodSignature: string = '';

		if (currentWord === '(') {
			methodSignature =
				lastWord + fileContent!.substring(counter, methodBracketIndex);
		} else {
			methodSignature = fileContent!.substring(
				counter - currentWord.length,
				methodBracketIndex,
			);
		}

		const returnTypeIndex = methodSignature.lastIndexOf(':');
		const paramsClosingIndex = methodSignature.lastIndexOf(')');
		if (returnTypeIndex > paramsClosingIndex) {
			returnType = methodSignature.substring(returnTypeIndex + 1);
			methodNameAndParams = methodSignature.substring(0, returnTypeIndex);
		} else {
			returnType = 'any';
			methodNameAndParams = methodSignature;
		}

		classes[classes.length - 1].methods.push({
			visibility: lastVisibilityOperator.pop() ?? '',
			returnType: returnType,
			fn: methodNameAndParams.trim().replace(/\n/g, '').replace(/ /g, ''),
		});

		counter = getClosingBracket(methodBracketIndex + 1);
	} else if (currentWordType === 'class') {
		currentContext = 'class';

		const classBracketIndex = fileContent!.indexOf('{', counter);
		const withoutClassKeyword = fileContent!
			.substring(counter, classBracketIndex)
			.trim();
		const classNameEndIndex =
			withoutClassKeyword.indexOf(' ') > -1
				? withoutClassKeyword.indexOf(' ')
				: classBracketIndex;
		const className = withoutClassKeyword.substring(0, classNameEndIndex);

		let classParents: string[] = [];
		if (classNameEndIndex !== classBracketIndex) {
			classParents = withoutClassKeyword
				.substring(classNameEndIndex, classBracketIndex)
				.replace(',', ' ')
				.split(' ')
				.filter((item) => item != '');
			classParents.shift();
		}

		classBrackets.push('{');
		counter = classBracketIndex;

		classes.push({
			name: className,
			parentclasses: classParents,
			methods: [],
			attributes: [],
		});
	} else if (currentWordType === 'function') {
		let returnType: string = 'any';
		let functionName: string = '';
		let functionParams: string = '';

		const functionBracketIndex = fileContent!.indexOf('{', counter);
		const withoutFunctionKeyword = fileContent!
			.substring(counter, functionBracketIndex)
			.trim();

		const returnTypeIndex = withoutFunctionKeyword.lastIndexOf(':');
		const paramsClosingIndex = withoutFunctionKeyword.lastIndexOf(')');
		const paramsOpeningIndex = withoutFunctionKeyword.indexOf('(');
		if (returnTypeIndex > paramsClosingIndex) {
			returnType = withoutFunctionKeyword.substring(returnTypeIndex).trim();
		}
		functionName = withoutFunctionKeyword.substring(0, paramsOpeningIndex);
		functionParams = withoutFunctionKeyword.substring(
			paramsOpeningIndex,
			paramsClosingIndex + 1,
		);

		functions.push({
			name: functionName,
			returnType: returnType,
			functionParams: functionParams,
		});
	} else if (currentWordType === 'variable') {
		let variableName: string = '';
		let variableType: string = 'any';

		const nextEqualIndex =
			fileContent!.indexOf('=', counter) > 0
				? fileContent!.indexOf('=', counter)
				: Infinity;
		const nextNewlineIndex =
			fileContent!.indexOf('\n', counter) > 0
				? fileContent!.indexOf('\n', counter)
				: Infinity;
		const nextSemicolonIndex =
			fileContent!.indexOf(';', counter) > 0
				? fileContent!.indexOf(';', counter)
				: Infinity;

		const variableEndIndex: number = Math.min(
			nextNewlineIndex,
			nextEqualIndex,
			nextSemicolonIndex,
		);

		const wholeVariable = fileContent!.substring(counter, variableEndIndex);

		const typeStartIndex: number = wholeVariable.indexOf(':');
		if (typeStartIndex > -1) {
			variableType = wholeVariable.substring(typeStartIndex + 1);
			variableName = wholeVariable.substring(0, typeStartIndex);
		} else {
			variableName = wholeVariable.substring(0, wholeVariable.length - 1);
		}

		variables.push({
			name: variableName.trim(),
			type: variableType.trim(),
		});
	}
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

drawClasses(classes);

console.log('function-Array:', functions);
console.log('variable-Array:', variables);
