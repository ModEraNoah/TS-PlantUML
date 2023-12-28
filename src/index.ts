import fs from 'fs';

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

let counter: number = 0;
let wordStart: number = 0;
let wordEnd: number = 0;
let lastWord: string = '';
console.log('file-length:', fileContent!.length);
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
		currentWord !== 'Error'
	) {
		if (currentWord === '(') {
			console.log(
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
					.replace(/ /g, ''),
			);
			counter = Math.min(
				fileContent!.indexOf('{', counter - currentWord.length),
				fileContent!.indexOf(';', counter - currentWord.length),
			);
		} else if (currentWord!.includes('(')) {
			const newCounter = Math.min(
				Math.max(
					fileContent!.indexOf('{', counter - currentWord.length),
					counter,
				),
				Math.max(
					fileContent!.indexOf(';', counter - currentWord.length),
					counter,
				),
			);
			console.log(
				fileContent!
					.substring(counter - currentWord.length, newCounter)
					.trim()
					.replace(/\n/g, '')
					.replace(/ /g, ''),
			);
			counter = newCounter;
		}
	} else {
		console.log(currentWord);
	}
	return currentWord;
}
