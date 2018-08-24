import { Tree } from "ts-tree";
import { Model } from "./Model";
import { ModelEvent } from "./ModelEvent";

const isBrowser = typeof navigator === "undefined";
const isMac = isBrowser ? false : navigator.platform.toUpperCase().indexOf("MAC") >= 0;

export class HTMLView<V> {
	private readonly treeToHtmlEl: Map<Tree<V>, HTMLElement> = new Map();
	private readonly htmlElToTree: Map<HTMLElement, Tree<V>> = new Map();
	private cursorEl: HTMLElement | null = null;
	private mirrorEl?: HTMLElement;
	private clickedEl?: HTMLElement;
	private dragoverTree?: Tree<V>;

	constructor(
		private readonly model: Model<V>,
		private readonly valueToHtmlEl: (v: V) => Node,
		private readonly rootUlEl: Node
	) {
		this.bind();
	}

	bind() {
		this.model.subscribe(this.handleModelEvent);
		document.addEventListener("mousedown", this.handleMousedownEvent);
		document.addEventListener("mouseup", this.handleMouseupEvent);
		document.addEventListener("click", this.handleClickEvent);
		document.addEventListener("keydown", this.handleKeyboardEvent);
		document.addEventListener("dragstart", this.handleDragstartEvent);
		document.addEventListener("dragenter", this.handleDragenterEvent);
		document.addEventListener("dragend", this.handleDragendEvent);
	}

	unbind() {
		this.model.unsubscribe(this.handleModelEvent);
		document.removeEventListener("mousedown", this.handleMousedownEvent);
		document.removeEventListener("mouseup", this.handleMouseupEvent);
		document.removeEventListener("click", this.handleClickEvent);
		document.removeEventListener("keydown", this.handleKeyboardEvent);
		document.removeEventListener("dragstart", this.handleDragstartEvent);
		document.removeEventListener("dragenter", this.handleDragenterEvent);
		document.removeEventListener("dragend", this.handleDragendEvent);
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

	private handleMousedownEvent = (e: MouseEvent) => {
		const targetTree = this.getTarget(e);
		if (targetTree) {
			this.clickedEl = this.getHtmlEl(targetTree);
			this.clickedEl.setAttribute("draggable", "true");

			// If ctrl+shift are pressed, then default to calling it a ctrl
			// (MS defaults to shift, Dropbox to ctrl).
			if (e.ctrlKey || e.metaKey) {
				this.model.selectToggle(targetTree);
			} else if (e.shiftKey) {
				this.model.selectUntil(targetTree);
			} else {
				if (!this.model.isSelected(targetTree)) {
					this.model.selectOne(targetTree);
				}
			}
		}
	};

	private handleMouseupEvent = (e: MouseEvent) => {
		if (this.clickedEl) {
			this.clickedEl.removeAttribute("draggable");
		}
		const targetTree = this.getTarget(e);
		if (targetTree) {
			if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
				if (this.model.isSelected(targetTree)) {
					this.model.selectOne(targetTree);
				}
			}
		}
	};

	private handleClickEvent = (e: MouseEvent) => {
		const targetTree = this.getTarget(e);
		if (!this.getTarget(e)) {
			this.model.resetSelection();
		}
	};

	private handleKeyboardEvent = (e: KeyboardEvent) => {
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
	};

	private handleDragstartEvent = (e: DragEvent) => {
		e.dataTransfer.setData("text/html", "");
		e.dataTransfer.dropEffect = "move";

		const target = this.getTarget(e);
		if (!target) {
			return;
		}

		this.mirrorEl = document.createElement("ul");
		this.mirrorEl.classList.add("mirror");
		for (const subtree of this.model.selectedSubtrees) {
			const subtreeEl = this.getHtmlEl(subtree);
			this.mirrorEl.appendChild(subtreeEl.cloneNode(true));
		}
		document.body.appendChild(this.mirrorEl);
		e.dataTransfer.setDragImage(this.mirrorEl, 0, 0);
	};

	private handleDragenterEvent = (e: DragEvent) => {
		const targetTree = this.getTarget(e);
		if (this.dragoverTree) {
			this.getHtmlEl(this.dragoverTree).classList.remove("over");
			this.dragoverTree = undefined;
		}
		if (!targetTree || this.model.isLeaf(targetTree)) {
			return;
		}
		for (const subtree of this.model.selectedSubtrees) {
			if (targetTree === subtree || targetTree.isChildOf(subtree)) {
				return;
			}
		}
		this.getHtmlEl(targetTree).classList.add("over");
		this.dragoverTree = targetTree;
	};

	private handleDragendEvent = (e: DragEvent) => {
		if (this.mirrorEl) {
			this.mirrorEl.remove();
		}
		if (this.dragoverTree) {
			this.model.insertAllIn(this.dragoverTree, ...this.model.selectedSubtrees);
			this.getHtmlEl(this.dragoverTree).classList.remove("over");
			this.dragoverTree = undefined;
		}
	};

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
