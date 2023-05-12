import { Program } from "../program/Program";
export class FieldFactory {
    static createField(type, dimensions, fragmentShaderWritable = false) {
        //let thisFieldSize = type.getPrimitivesList().length * 4 * product(dimensions)
        if (fragmentShaderWritable) {
            Program.getCurrentProgram().materializeCurrentTree();
        }
        let field = Program.getCurrentProgram().partialTree.addNaiveDenseField(type, dimensions);
        if (fragmentShaderWritable) {
            field.snodeTree.fragmentShaderWritable = true;
            Program.getCurrentProgram().materializeCurrentTree();
        }
        return field;
    }
}
