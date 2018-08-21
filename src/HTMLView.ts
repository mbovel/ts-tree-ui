import { Tree } from "ts-tree";
import { Model } from "./Model";
import { ModelEvent } from "./ModelEvent";

const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;

export class HTMLView<V> {
	private readonly treeToHtmlEl: Map<Tree<V>, HTMLElement> = new Map();
	private readonly htmlElToTree: Map<HTMLElement, Tree<V>> = new Map();
	private readonly modelEventHandler: (e: ModelEvent<V>) => void;
	private readonly mouseEventHandler: (e: MouseEvent) => void;
	private readonly keyboardEventHandler: (e: KeyboardEvent) => void;
	private cursorEl: HTMLElement | null = null;

	constructor(
		private readonly model: Model<V>,
		private readonly valueToHtmlEl: (v: V) => Node,
		private readonly rootUlEl: Node
	) {
		this.modelEventHandler = this.handleModelEvent.bind(this);
		this.mouseEventHandler = this.handleMouseEvent.bind(this);
		this.keyboardEventHandler = this.handleKeyboardEvent.bind(this);
		this.model.subscribe(this.modelEventHandler);
		document.addEventListener("mousedown", this.mouseEventHandler);
		document.addEventListener("keydown", this.keyboardEventHandler);
	}

	unbind() {
		this.model.unsubscribe(this.modelEventHandler);
		this.rootUlEl.removeEventListener("mousedown", this.mouseEventHandler);
	}

	private handleModelEvent(e: ModelEvent<V>) {
		switch (e.type) {
			case "insert": {
				const newNodeEl = document.createElement("li");
				newNodeEl.appendChild(this.valueToHtmlEl(e.tree.value));
				newNodeEl.appendChild(document.createElement("ul"));
				const nextSiblingEl = e.tree.nextSibling
					? this.getHtmlEl(e.tree.nextSibling)
					: null;
				const parentEl = e.tree.parent
					? this.getHtmlEl(e.tree.parent).childNodes[1]
					: this.rootUlEl;
				parentEl.insertBefore(newNodeEl, nextSiblingEl);
				this.htmlElToTree.set(newNodeEl, e.tree);
				this.treeToHtmlEl.set(e.tree, newNodeEl);
				break;
			}
			case "remove": {
				const el = this.getHtmlEl(e.tree);
				if (!el.parentElement) {
					throw new Error("Cannot remove root element");
				}
				this.htmlElToTree.delete(el);
				this.treeToHtmlEl.delete(e.tree);
				el.parentElement.removeChild(el);
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
	}

	private handleMouseEvent(e: MouseEvent) {
		const targetTree = this.getTarget(e);
		if (targetTree) {
			// If ctrl+shift are pressed, then default to calling it a ctrl
			// (MS defaults to shift, Dropbox to ctrl).
			if (e.ctrlKey || e.metaKey) {
				e.preventDefault();
				this.model.selectToggle(targetTree);
			} else if (e.shiftKey) {
				e.preventDefault();
				this.model.selectUntil(targetTree);
			} else {
				e.preventDefault();
				this.openToggle(targetTree);
				this.model.selectOne(targetTree);
			}
		} else {
			this.model.resetSelection();
		}
	}

	private handleKeyboardEvent(e: KeyboardEvent) {
		if (e.ctrlKey || e.metaKey) {
			switch (e.key) {
				case "a":
					e.preventDefault();
					this.model.selectAll();
					break;
				case "c":
					e.preventDefault();
					this.model.copy();
					break;
				case "v":
					e.preventDefault();
					this.model.paste();
					break;
			}
		} else {
			switch (e.key) {
				case "ArrowUp":
					e.preventDefault();
					this.model.selectPrev();
					break;
				case "ArrowDown":
					e.preventDefault();
					this.model.selectNext();
					break;
				case "ArrowRight":
					for (const tree of this.model.selectedSubtrees) {
						this.getHtmlEl(tree).classList.remove("closed");
					}
					break;
				case "ArrowLeft":
					for (const tree of this.model.selectedSubtrees) {
						this.getHtmlEl(tree).classList.add("closed");
					}
					e.preventDefault();
					break;
				case "Delete":
					e.preventDefault();
					this.model.delete();
					break;
				case "Backspace":
					if (isMac) {
						e.preventDefault();
						this.model.delete();
					}
					break;
			}
		}
	}

	private openToggle(tree: Tree<V>) {
		if (this.isOnlySelected(tree)) this.getHtmlEl(tree).classList.toggle("closed");
	}

	private isOnlySelected(tree: Tree<V>) {
		return this.model.selection.size === 1 && this.model.selection.has(tree);
	}

	private getTarget(e: Event): Tree<V> | undefined {
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

	private getHtmlEl(tree: Tree<V>): HTMLElement {
		const result = this.treeToHtmlEl.get(tree);
		if (!result) {
			throw new Error("No such tree");
		}
		return result;
	}

	private getNode(el: HTMLElement): Tree<V> {
		const result = this.htmlElToTree.get(el);
		if (!result) {
			throw new Error("No such tree");
		}
		return result;
	}
}
