import { Tree } from "ts-tree";
import { Controller } from "./Controller";
import { Model } from "./Model";
import { ModelEvent } from "./ModelEvent";

export class View<V> {
	protected readonly controller: Controller<V>;
	private cursorEl: HTMLElement | null = null;
	private readonly treeToHtmlEl: Map<Tree<V>, HTMLElement> = new Map();
	private readonly htmlElToTree: Map<HTMLElement, Tree<V>> = new Map();

	constructor(
		protected readonly model: Model<V>,
		protected readonly valueToHtmlEl: (v: V) => Node,
		protected readonly rootUlEl: Node
	) {
		this.controller = new Controller<V>(this, model);
	}

	bind() {
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

	protected insert(tree: Tree<V>): HTMLElement {
		const treeEl = document.createElement("li");
		treeEl.appendChild(this.valueToHtmlEl(tree.value));
		const childrenContainerEl = document.createElement("ul");
		treeEl.appendChild(childrenContainerEl);
		this.htmlElToTree.set(treeEl, tree);
		this.treeToHtmlEl.set(tree, treeEl);
		const parentEl = this.getParentEl(tree);
		return parentEl.insertBefore(treeEl, this.getNextSiblingEl(tree));
	}

	protected remove(tree: Tree<V>) {
		const treeEl = this.getHtmlEl(tree);
		this.htmlElToTree.delete(treeEl);
		this.treeToHtmlEl.delete(tree);
		treeEl.remove();
	}

	protected changeValue(tree: Tree<V>) {
		const treeEl = this.getHtmlEl(tree);
		if (!treeEl.firstChild) {
			throw new Error("");
		}
		treeEl.replaceChild(this.valueToHtmlEl(tree.value), treeEl.firstChild);
	}

	private handleModelEvent = (e: ModelEvent<V>) => {
		switch (e.type) {
			case "insert": {
				this.insert(e.tree);
				break;
			}
			case "remove": {
				this.remove(e.tree);
				break;
			}
			case "change-value": {
				this.changeValue(e.tree);
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

	private getNextSiblingEl(tree: Tree<V>): Node | null {
		return tree.nextSibling ? this.getHtmlEl(tree.nextSibling) : null;
	}

	private getParentEl(tree: Tree<V>): Node {
		if (!tree.parent) {
			return this.rootUlEl;
		}
		const ulEl = this.getHtmlEl(tree.parent).querySelector("ul");
		if (!ulEl) {
			throw new Error();
		}
		return ulEl;
	}
}
