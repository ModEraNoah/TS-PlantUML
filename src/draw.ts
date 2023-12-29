export function drawClasses(
    classes: {
        name: string;
        parentclasses: string[];
        methods: { visibility: string; returnType: string; fn: string }[];
        attributes: { visibility: string; name: string; type: string }[];
    }[],
) {
    console.log('@startuml');
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
        }
        console.log('}\n');
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
