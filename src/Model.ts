import { PubSub } from "ts-pubsub";
import { Tree } from "ts-tree";
import { ModelEvent } from "./ModelEvent";

export class Model<V> {
	private clipboard: Tree<V>[] = [];
	private selection: Set<Tree<V>> = new Set();
	private cursor?: Tree<V>;
	private pubsub: PubSub<ModelEvent<V>> = new PubSub();

	constructor(
		readonly root: Tree<V>,
		readonly isLeaf: (tree: Tree<V>) => boolean,
		readonly sort: (a: V, b: V) => number
	) {}

	subscribe(fn: (e: ModelEvent<V>) => any) {
		this.pubsub.subscribe(fn);
		this.emitTree(this.root);
	}

	unsubscribe(fn: (e: ModelEvent<V>) => any) {
		this.pubsub.unsubscribe(fn);
	}

	get sortedSelection() {
		const result = [...this.selection];
		result.sort((a, b) => a.isBefore(b));
		return result;
	}

	get selectedSubtrees() {
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

	isSelected(tree: Tree<V>) {
		return this.selection.has(tree);
	}

	isOnlySelected(tree: Tree<V>) {
		return this.selection.size === 1 && this.selection.has(tree);
	}

	selectOne(tree?: Tree<V>) {
		if (tree && this.selection.size === 1 && this.selection.has(tree)) {
			return;
		}
		for (const node of this.selection) {
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
		if (this.cursor && this.cursor.previous) this.selectOne(this.cursor.previous);
	}

	selectNext() {
		if (this.cursor && this.cursor.next) this.selectOne(this.cursor.next);
	}

	selectToggle(tree: Tree<V>) {
		if (this.selection.has(tree)) {
			this.unselect(tree);
		} else {
			this.addToSelection(tree);
			this.setCursor(tree);
		}
	}

	selectUntil(tree: Tree<V>) {
		if (!this.cursor) {
			return;
		}
		const isBefore = tree.isBefore(this.cursor) < 0;
		let current: Tree<V> | undefined = isBefore ? tree : this.cursor.next;
		const end: Tree<V> | undefined = isBefore ? this.cursor : tree.next;
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
		for (const node of this.selection) {
			this.removeFromSelection(node);
		}
		this.ensureValidCursor();
	}

	unselect(target: Tree<V>) {
		this.removeFromSelection(target);
		this.ensureValidCursor();
	}

	copy(): void {
		this.clipboard = this.selectedSubtrees.map(t => t.clone());
	}

	paste(): void {
		if (!this.cursor) {
			return;
		}
		this.insertAllIn(this.cursor, this.clipboard.map(t => t.clone()));
	}

	insertAllIn(target: Tree<V>, trees: Tree<V>[]) {
		const isLeaf = this.isLeaf(target);
		const parent = isLeaf ? target.parent : target;
		const previousSibling = isLeaf ? target : undefined;
		if (!parent) {
			return;
		}
		for (const tree of trees.reverse()) {
			if (tree.root === this.root) {
				this.remove(tree);
			}
			this.insertAfter(parent, previousSibling, tree);
		}
		this.pubsub.emit({ type: "tree-change", tree: this.root });
	}

	delete(): void {
		for (const tree of this.selectedSubtrees) {
			this.remove(tree);
		}
		this.ensureValidCursor();
		this.pubsub.emit({ type: "tree-change", tree: this.root });
	}

	private insertAfter(parent: Tree<V>, reference: Tree<V> | undefined, tree: Tree<V>) {
		const firstLarger = parent.children.find(child => this.sort(child.value, tree.value) > 0);
		parent.insertBefore(firstLarger, tree);
		this.pubsub.emit({ type: "insert", tree });
		this.emitTree(tree.firstChild);
	}

	private remove(tree: Tree<V>) {
		this.removeFromSelection(tree);
		tree.remove();
		this.pubsub.emit({ type: "remove", tree });
	}

	private addToSelection(tree: Tree<V>) {
		if (!this.selection.has(tree)) {
			this.selection.add(tree);
			this.pubsub.emit({ type: "add-to-selection", tree });
		}
	}

	private removeFromSelection(tree: Tree<V>) {
		if (this.selection.delete(tree)) {
			this.pubsub.emit({ type: "remove-from-selection", tree });
		}
	}

	private setCursor(tree?: Tree<V>) {
		if (tree !== this.cursor) {
			this.pubsub.emit({ type: "move-cursor", tree });
		}
		this.cursor = tree;
	}

	private ensureValidCursor() {
		if (this.cursor && this.cursor.root !== this.root) {
			const first = this.selection.values().next();
			this.setCursor(first.done ? undefined : first.value);
		} else {
			this.setCursor(undefined);
		}
	}

	private emitTree(tree?: Tree<V>) {
		if (!tree) {
			return;
		}
		this.emitTree(tree.nextSibling);
		this.pubsub.emit({ type: "insert", tree });
		this.emitTree(tree.firstChild);
	}
}
