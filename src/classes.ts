export class FileType {
	private classes: ClassType[] = []
	private functions: FunctionType[] = []
	private variables: VariableType[] = []

}

export class ClassType {
	private methods: FunctionType[] = []
	private attributes: VariableType[] = []
}

export class FunctionType {
	private returnType: string | VariableType | ClassType = ""
	private paramsType: VariableType[] = []
}

export class VariableType {
	private name: string = ""
	private type: string | FunctionType | ClassType = ""
	private kind: "private" | "public" | "static" = "private"
}
