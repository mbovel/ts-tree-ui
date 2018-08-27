import { View } from "./View";
import { Model } from "./Model";
import { Tree } from "ts-tree";

const isBrowser = typeof navigator === "undefined";
const isMac = isBrowser ? false : navigator.platform.toUpperCase().indexOf("MAC") >= 0;

export class Controller<V> {
	constructor(readonly view: View<V>, readonly model: Model<V>) {}
	private mirrorEl?: HTMLElement;
	private clickedEl?: HTMLElement;
	private dragoverTree?: Tree<V>;

	public bind() {
		document.addEventListener("mousedown", this.handleMousedownEvent);
		document.addEventListener("mouseup", this.handleMouseupEvent);
		document.addEventListener("click", this.handleClickEvent);
		document.addEventListener("keydown", this.handleKeyboardEvent);
		document.addEventListener("dragstart", this.handleDragstartEvent);
		document.addEventListener("dragenter", this.handleDragenterEvent);
		document.addEventListener("dragend", this.handleDragendEvent);
	}

	public unbind() {
		document.removeEventListener("mousedown", this.handleMousedownEvent);
		document.removeEventListener("mouseup", this.handleMouseupEvent);
		document.removeEventListener("click", this.handleClickEvent);
		document.removeEventListener("keydown", this.handleKeyboardEvent);
		document.removeEventListener("dragstart", this.handleDragstartEvent);
		document.removeEventListener("dragenter", this.handleDragenterEvent);
		document.removeEventListener("dragend", this.handleDragendEvent);
	}

	private handleMousedownEvent = (e: MouseEvent) => {
		const targetTree = this.view.getTarget(e);
		if (targetTree) {
			this.clickedEl = this.view.getHtmlEl(targetTree);
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
		const targetTree = this.view.getTarget(e);
		if (targetTree) {
			if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
				if (this.model.isSelected(targetTree)) {
					this.model.selectOne(targetTree);
				}
			}
		}
	};

	private handleClickEvent = (e: MouseEvent) => {
		if (!this.view.getTarget(e)) {
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
						this.view.getHtmlEl(tree).classList.remove("closed");
					}
					break;
				case "ArrowLeft":
					for (const tree of this.model.selectedSubtrees) {
						this.view.getHtmlEl(tree).classList.add("closed");
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

		const target = this.view.getTarget(e);
		if (!target) {
			return;
		}

		this.mirrorEl = document.createElement("ul");
		this.mirrorEl.classList.add("mirror");
		for (const subtree of this.model.selectedSubtrees) {
			const subtreeEl = this.view.getHtmlEl(subtree);
			this.mirrorEl.appendChild(subtreeEl.cloneNode(true));
		}
		document.body.appendChild(this.mirrorEl);
		e.dataTransfer.setDragImage(this.mirrorEl, 0, 0);
	};

	private handleDragenterEvent = (e: DragEvent) => {
		const targetTree = this.view.getTarget(e);
		if (this.dragoverTree) {
			this.view.getHtmlEl(this.dragoverTree).classList.remove("over");
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
		this.view.getHtmlEl(targetTree).classList.add("over");
		this.dragoverTree = targetTree;
	};

	private handleDragendEvent = (e: DragEvent) => {
		if (this.mirrorEl) {
			this.mirrorEl.remove();
		}
		if (this.dragoverTree) {
			this.model.insertAllIn(this.dragoverTree, ...this.model.selectedSubtrees);
			this.view.getHtmlEl(this.dragoverTree).classList.remove("over");
			this.dragoverTree = undefined;
		}
	};
}
