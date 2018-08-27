import { Tree } from "ts-tree";
import { Model } from "./Model";
import { ModelEvent } from "./ModelEvent";
import { Controller } from "./Controller";

export class View<V> {
	private readonly controller: Controller<V>;
	private readonly treeToHtmlEl: Map<Tree<V>, HTMLElement> = new Map();
	private readonly htmlElToTree: Map<HTMLElement, Tree<V>> = new Map();
	private cursorEl: HTMLElement | null = null;

	constructor(
		private readonly model: Model<V>,
		private readonly valueToHtmlEl: (v: V) => Node,
		private readonly rootUlEl: Node
	) {
		this.controller = new Controller<V>(this, model);
	}

	init() {
		this.bindModel();
		this.bindController();
	}

	bindModel() {
		this.model.subscribe(this.handleModelEvent);
		this.model.emitAllInserts(this.handleModelEvent);
	}

	unbindModel() {
		this.model.unsubscribe(this.handleModelEvent);
	}

	bindController() {
		this.controller.bind();
	}

	unbindController() {
		this.controller.unbind();
	}

	private handleModelEvent = (e: ModelEvent<V>) => {
		switch (e.type) {
			case "insert": {
				const parentEl = this.getParentEl(e.tree);
				parentEl.insertBefore(this.createTreeEl(e.tree), this.getNextSiblingEl(e.tree));
				break;
			}
			case "remove": {
				this.removeTreeEl(e.tree);
				break;
			}
			case "add-to-selection": {
				this.getHtmlEl(e.tree).classList.add("selected");
				break;
			}
			case "remove-from-selection": {
				this.getHtmlEl(e.tree).classList.remove("selected");
				break;
			}
			case "move-cursor": {
				if (this.cursorEl) {
					this.cursorEl.classList.remove("cursor");
				}
				if (e.tree) {
					this.cursorEl = this.getHtmlEl(e.tree);
					this.cursorEl.classList.add("cursor");
				} else {
					this.cursorEl = null;
				}
			}
		}
	};

	private createTreeEl(tree: Tree<V>) {
		const treeEl = document.createElement("li");
		treeEl.appendChild(this.valueToHtmlEl(tree.value));
		const childrenContainerEl = document.createElement("ul");
		treeEl.appendChild(childrenContainerEl);
		this.htmlElToTree.set(treeEl, tree);
		this.treeToHtmlEl.set(tree, treeEl);
		return treeEl;
	}

	private removeTreeEl(tree: Tree<V>) {
		const treeEl = this.getHtmlEl(tree);
		this.htmlElToTree.delete(treeEl);
		this.treeToHtmlEl.delete(tree);
		treeEl.remove();
	}

	private getNextSiblingEl(tree: Tree<V>): Node | null {
		return tree.nextSibling ? this.getHtmlEl(tree.nextSibling) : null;
	}

	private getParentEl(tree: Tree<V>): Node {
		return tree.parent ? this.getHtmlEl(tree.parent).childNodes[1] : this.rootUlEl;
	}

	getHtmlEl(tree: Tree<V>): HTMLElement {
		const result = this.treeToHtmlEl.get(tree);
		if (!result) {
			throw new Error("No such tree");
		}
		return result;
	}

	getTree(el: HTMLElement): Tree<V> {
		const result = this.htmlElToTree.get(el);
		if (!result) {
			throw new Error("No such tree");
		}
		return result;
	}

	getTarget(e: Event): Tree<V> | undefined {
		if (e.target instanceof Node) {
			for (let current: Node | null = e.target; current; current = current.parentNode) {
				if (current instanceof HTMLElement) {
					const tree = this.htmlElToTree.get(current);
					if (tree) {
						return tree;
					}
				}
			}
		}
	}
}