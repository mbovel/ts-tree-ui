import { Tree } from "ts-tree";
import { Model } from "./Model";
import { ModelEvent } from "./ModelEvent";

const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;

export class HTMLView<V> {
	private readonly treeToHtmlEl: Map<Tree<V>, HTMLElement> = new Map();
	private readonly htmlElToTree: Map<HTMLElement, Tree<V>> = new Map();
	private readonly modelEventHandler: (e: ModelEvent<V>) => void;
	private readonly mousedownEventHandler: (e: MouseEvent) => void;
	private readonly mouseupEventHandler: (e: MouseEvent) => void;
	private readonly keyboardEventHandler: (e: KeyboardEvent) => void;
	private readonly dragstartEventHandler: (e: KeyboardEvent) => void;
	private readonly dragenterEventHandler: (e: KeyboardEvent) => void;
	private readonly dragendEventHandler: (e: KeyboardEvent) => void;
	private cursorEl: HTMLElement | null = null;
	private mirrorEl?: HTMLElement;
	private overTree?: Tree<V>;

	constructor(
		private readonly model: Model<V>,
		private readonly valueToHtmlEl: (v: V) => Node,
		private readonly rootUlEl: Node
	) {
		this.modelEventHandler = this.handleModelEvent.bind(this);
		this.mousedownEventHandler = this.handleMousedownEvent.bind(this);
		this.mouseupEventHandler = this.handleMouseupEvent.bind(this);
		this.keyboardEventHandler = this.handleKeyboardEvent.bind(this);
		this.dragstartEventHandler = this.handleDragstartEvent.bind(this);
		this.dragenterEventHandler = this.handleDragenterEvent.bind(this);
		this.dragendEventHandler = this.handleDragendEvent.bind(this);
		this.model.subscribe(this.modelEventHandler);
		document.addEventListener("mousedown", this.mousedownEventHandler);
		document.addEventListener("mouseup", this.mouseupEventHandler);
		document.addEventListener("keydown", this.keyboardEventHandler);
		document.addEventListener("dragstart", this.dragstartEventHandler);
		document.addEventListener("dragenter", this.dragenterEventHandler);
		document.addEventListener("dragend", this.dragendEventHandler);
	}

	unbind() {
		this.model.unsubscribe(this.modelEventHandler);
		this.rootUlEl.removeEventListener("mousedown", this.mousedownEventHandler);
		this.rootUlEl.removeEventListener("mouseup", this.mouseupEventHandler);
		this.rootUlEl.removeEventListener("keydown", this.keyboardEventHandler);
		this.rootUlEl.removeEventListener("dragstart", this.dragstartEventHandler);
		this.rootUlEl.removeEventListener("dragenter", this.dragenterEventHandler);
		this.rootUlEl.removeEventListener("dragend", this.dragendEventHandler);
	}

	private handleModelEvent(e: ModelEvent<V>) {
		switch (e.type) {
			case "insert": {
				const newNodeEl = document.createElement("li");
				newNodeEl.appendChild(this.valueToHtmlEl(e.tree.value));
				const childrenContainerEl = document.createElement("ul");
				newNodeEl.setAttribute("draggable", "true");
				newNodeEl.appendChild(childrenContainerEl);
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

	private handleMousedownEvent(e: MouseEvent) {
		const targetTree = this.getTarget(e);
		if (targetTree) {
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
		} else {
			this.model.resetSelection();
		}
	}

	private handleMouseupEvent(e: MouseEvent) {
		const targetTree = this.getTarget(e);
		if (targetTree) {
			if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
				if (this.model.isSelected(targetTree)) {
					this.model.selectOne(targetTree);
				}
			}
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

	private handleDragstartEvent(e: DragEvent) {
		e.dataTransfer.setData("text/html", "hello!!");
		e.dataTransfer.dropEffect = "move";

		const target = this.getTarget(e);
		if (!target) return;

		this.mirrorEl = document.createElement("ul");
		this.mirrorEl.classList.add("mirror");
		for (const subtree of this.model.selectedSubtrees) {
			const subtreeEl = this.getHtmlEl(subtree);
			this.mirrorEl.appendChild(subtreeEl.cloneNode(true));
		}
		document.body.appendChild(this.mirrorEl);
		e.dataTransfer.setDragImage(this.mirrorEl, 0, 0);
	}

	private handleDragenterEvent(e: DragEvent) {
		const targetTree = this.getTarget(e);
		if (this.overTree) {
			this.getHtmlEl(this.overTree).classList.remove("over");
			this.overTree = undefined;
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
		this.overTree = targetTree;
	}

	private handleDragendEvent(e: DragEvent) {
		if (this.mirrorEl) {
			this.mirrorEl.remove();
		}
		if (this.overTree) {
			this.model.insertAllIn(this.overTree, this.model.selectedSubtrees);
			this.getHtmlEl(this.overTree).classList.remove("over");
			this.overTree = undefined;
		}
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
