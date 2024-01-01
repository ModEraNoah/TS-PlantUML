export function drawClasses(
    classes: {
        name: string;
        parentclasses: string[];
        methods: { visibility: string; returnType: string; fn: string }[];
        attributes: { visibility: string; name: string; type: string }[];
    }[],
) {
    console.log('@startuml');
    const relations: string[] = [];
    for (let classIndex = 0; classIndex < classes.length; classIndex++) {
        console.log('class ' + classes[classIndex].name + '{\n');
        for (
            let attributeIndex = 0;
            attributeIndex < classes[classIndex].attributes.length;
            attributeIndex++
        ) {
            console.log(
                getVisibility(
                    classes[classIndex].attributes[attributeIndex].visibility,
                ) +
                ' ' +
                classes[classIndex].attributes[attributeIndex].name +
                ': ' +
                classes[classIndex].attributes[attributeIndex].type,
            );
            setRelations(
                classes[classIndex].name,
                classes[classIndex].attributes[attributeIndex].type,
                relations,
            );
        }
        for (
            let methodIndex = 0;
            methodIndex < classes[classIndex].methods.length;
            methodIndex++
        ) {
            console.log(
                getVisibility(classes[classIndex].methods[methodIndex].visibility) +
                ' ' +
                classes[classIndex].methods[methodIndex].fn +
                ': ' +
                classes[classIndex].methods[methodIndex].returnType,
            );
            setRelations(
                classes[classIndex].name,
                classes[classIndex].methods[methodIndex].returnType,
                relations,
            );
        }

        for (let i = 0; i < classes[classIndex].parentclasses.length; i++) {
            relations.push(
                classes[classIndex].name +
                ' --|> ' +
                classes[classIndex].parentclasses[i],
            );
        }
        console.log('}\n');
    }
    for (let k = 0; k < relations.length; k++) {
        console.log(relations[k]);
    }
    console.log('@enduml');
}

function getVisibility(visibility: string): string {
    let prefix = '';
    if (visibility?.includes('static')) {
        prefix = '{static} ';
    }
    let vis = visibility?.substring(visibility.lastIndexOf(' '));
    switch (vis) {
        case 'public':
            return prefix + '+';
        case 'private':
            return prefix + '-';
        case 'protected':
            return prefix + '#';
        case 'package':
            return prefix + '~';
        case undefined:
            return prefix + '+';
        default:
            return prefix + vis;
    }
}
function setRelations(
    methodName: string,
    returnType: string,
    relationsArray: string[],
) {
    const ignoreTypes: string[] = [
        'any',
        'unknown',
        'void',
        'number',
        'string',
        'boolean',
        '',
    ];
    if (ignoreTypes.includes(returnType)) return;
    // TODO: Generics, Promises
    relationsArray.push(
        methodName + ' --> ' + returnType.replace('[', '').replace(']', ''),
    );
}
