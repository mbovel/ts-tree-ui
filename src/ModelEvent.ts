import { Tree } from "ts-tree";

export type ModelEvent<V> = Readonly<
	| {
			type:
				| "insert"
				| "remove"
				| "change-value"
				| "add-to-selection"
				| "remove-from-selection"
				| "open"
				| "close"
				| "tree-change";
			tree: Tree<V>;
	  }
	| {
			type: "move-cursor";
			tree?: Tree<V>;
	  }
>;
