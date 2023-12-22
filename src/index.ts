import fs from "fs";

function getFileContent(file: string) {
	let contents;
	try { contents = fs.readFileSync(file).toString() }
	catch (e) {
		console.error("error while reading file:", e);
		contents = null
	}
	return contents
}

const fileContent = getFileContent("/home/noah/Dokumente/Airline/src/Airline.ts")
if (fileContent) {
	const res = fileContent
	const arr = []
	for (let i = 0; i < fileContent.length; i++) {
		let k = res.indexOf("class", i)
		if (k > 0) {
			console.log("index of class:", k)
			const innerClassStartIndex = res.indexOf("{", k)
			const bracketArr = []
			bracketArr.push(fileContent[innerClassStartIndex])
			const classText = getInnerClass(fileContent, innerClassStartIndex + 1, bracketArr)
			i = k
			arr.push(classText)
		}
	}
	console.log(arr)

	const classClosing = arr[0].lastIndexOf("}")
	const methods: any = []
	for (let i = 0; i < classClosing - 1; i++) {
		i = getClassMethods(i, arr[0], methods)
	}
	console.log("methods: ", methods)
}

function getInnerClass(text: string, startIndex: number, bracketArr: string[]): string {
	let index = startIndex
	while (bracketArr.length > 0) {
		if (text[index] === "{") {
			bracketArr.push("{")
		} else if (text[index] === "}") {
			bracketArr.pop()
		}

		index++
	}
	return text.substring(startIndex, index)
}

function getClassMethods(startIndex: number, innerClassText: string, methodsArr: {}[]): number {
	let index = startIndex;
	let paramsStartIndex = innerClassText.indexOf("(", index)
	let paramsEndIndex = innerClassText.indexOf(")", paramsStartIndex)
	let methodParams = innerClassText.substring(paramsStartIndex, paramsEndIndex + 1).replace(/\n/g, "").replace(/ /g, "").replace(/,/g, ", ")

	const returnTypeIndex = innerClassText.indexOf(":", paramsEndIndex)
	const nextBracketStartIndex = innerClassText.indexOf("{", paramsEndIndex)
	let returnType: string | null = null 
	if (returnTypeIndex > 0 && nextBracketStartIndex > returnTypeIndex) {
		returnType = innerClassText.substring(returnTypeIndex + 1,nextBracketStartIndex ).trim()
	}

	const preParamsString = innerClassText.substring(index, paramsStartIndex).trimEnd()
	const paramsName = preParamsString.substring(preParamsString.lastIndexOf(" ") + 1)

	if (paramsName && methodParams) {
		//console.log({ name: paramsName, params: methodParams })
		methodsArr.push({ name: paramsName, params: methodParams, returnType: returnType })
	}

	index = innerClassText.indexOf("{", paramsEndIndex) + 1
	const bracketArr = ["{"]
	while (bracketArr.length > 0) {
		if (innerClassText[index] === "{") {
			bracketArr.push("{")
		} else if (innerClassText[index] === "}") {
			bracketArr.pop()
		}

		index++
	}

	return index
}

