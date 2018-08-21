import { PubSub } from "ts-pubsub";
import { Tree } from "ts-tree";
import { ModelEvent } from "./ModelEvent";

export class Model<V> {
	private _clipboard: Tree<V>[] = [];
	private _selection: Set<Tree<V>> = new Set();
	private _cursor?: Tree<V>;
	private _pubsub: PubSub<ModelEvent<V>> = new PubSub();

	constructor(readonly root: Tree<V>, readonly isLeaf: (tree: Tree<V>) => boolean) {}

	get selection(): ReadonlySet<Tree<V>> {
		return this._selection;
	}

	subscribe(fn: (e: ModelEvent<V>) => any) {
		this._pubsub.subscribe(fn);
		this.emitTree(this.root);
	}

	unsubscribe(fn: (e: ModelEvent<V>) => any) {
		this._pubsub.unsubscribe(fn);
	}

	selectOne(tree?: Tree<V>) {
		if (tree && this._selection.size === 1 && this._selection.has(tree)) {
			return;
		}
		for (const node of this._selection) {
			this.removeFromSelection(node);
		}
		if (!tree) {
			this.ensureValidCursor();
			return;
		}
		this.addToSelection(tree);
		this.setCursor(tree);
	}

	selectPrev() {
		this.selectOne(this._cursor && this._cursor.previous);
	}

	selectNext() {
		this.selectOne(this._cursor && this._cursor.next);
	}

	selectToggle(tree: Tree<V>) {
		if (this._selection.has(tree)) {
			this.unselect(tree);
		} else {
			this.addToSelection(tree);
			this.setCursor(tree);
		}
	}

	selectUntil(tree: Tree<V>) {
		if (!this._cursor) {
			return;
		}
		const isBefore = tree.isBefore(this._cursor) < 0;
		let current: Tree<V> | undefined = isBefore ? tree : this._cursor.next;
		const end: Tree<V> | undefined = isBefore ? this._cursor : tree.next;
		while (current && current !== end) {
			this.addToSelection(current);
			current = current.next;
		}
		this.setCursor(tree);
	}

	selectAll() {
		for (let current: Tree<V> | undefined = this.root; current; current = current.next) {
			this.addToSelection(current);
		}
	}

	resetSelection() {
		for (const node of this._selection) {
			this.removeFromSelection(node);
		}
		this.ensureValidCursor();
	}

	unselect(target: Tree<V>) {
		this.removeFromSelection(target);
		this.ensureValidCursor();
	}

	copy(): void {
		this._clipboard = this.selectedSubtrees.map(t => t.clone());
		this._clipboard.reverse();
	}

	paste(): void {
		if (!this._cursor) {
			return;
		}
		const isLeaf = this.isLeaf(this._cursor);
		const parent = isLeaf ? this._cursor.parent : this._cursor;
		const previousSibling = isLeaf ? this._cursor : undefined;
		if (!parent) {
			return;
		}
		for (const tree of this._clipboard) {
			this.insertAfter(parent, previousSibling, tree.clone());
		}
	}

	delete(): void {
		for (const tree of this.selectedSubtrees) {
			this.remove(tree);
		}
		this.ensureValidCursor();
	}

	private insertAfter(parent: Tree<V>, reference: Tree<V> | undefined, tree: Tree<V>) {
		parent.insertAfter(reference, tree);
		this._pubsub.emit({ type: "insert", tree });
		this.emitTree(tree.firstChild);
	}

	private remove(tree: Tree<V>) {
		this.removeFromSelection(tree);
		tree.remove();
		this._pubsub.emit({ type: "remove", tree });
	}

	private addToSelection(tree: Tree<V>) {
		if (!this._selection.has(tree)) {
			this._selection.add(tree);
			this._pubsub.emit({ type: "add-to-selection", tree });
		}
	}

	private removeFromSelection(tree: Tree<V>) {
		if (this._selection.delete(tree)) {
			this._pubsub.emit({ type: "remove-from-selection", tree });
		}
	}

	private setCursor(tree?: Tree<V>) {
		if (tree !== this._cursor) {
			this._pubsub.emit({ type: "move-cursor", tree });
		}
		this._cursor = tree;
	}

	private get sortedSelection() {
		const result = [...this._selection];
		result.sort((a, b) => a.isBefore(b));
		return result;
	}

	private get selectedSubtrees() {
		const result = [];
		let last: Tree<V> | null = null;
		for (const node of this.sortedSelection) {
			if (!last || !node.isChildOf(last)) {
				result.push(node);
				last = node;
			}
		}
		return result;
	}

	private ensureValidCursor() {
		if (this._cursor && this._cursor.root !== this.root) {
			const first = this._selection.values().next();
			this.setCursor(first.done ? undefined : first.value);
		}
	}

	private emitTree(tree?: Tree<V>) {
		if (!tree) {
			return;
		}
		this.emitTree(tree.nextSibling);
		this._pubsub.emit({ type: "insert", tree });
		this.emitTree(tree.firstChild);
	}
}
