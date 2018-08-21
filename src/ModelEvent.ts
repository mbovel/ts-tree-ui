import {Tree} from "ts-tree";

export type ModelEvent<V> = Readonly<{
    type: 'insert' | 'remove' | 'add-to-selection' | 'remove-from-selection';
    tree: Tree<V>;
} | {
    type: 'move-cursor';
    tree?: Tree<V>;
}>;