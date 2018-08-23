import { Tree } from "ts-tree";
import { HTMLView } from "../src/HTMLView";
import { Model } from "../src/Model";

const model = new Model<number>(
	new Tree(1, [new Tree(2, [new Tree(3, [new Tree(4)])]), new Tree(5), new Tree(6), new Tree(7)]),
	t => false,
	(a, b) => (a < b ? -1 : a > b ? 1 : 0)
);
const toHtml = (v: number) => {
	const text = document.createTextNode(v.toString());
	const containerEl = document.createElement("div");
	containerEl.appendChild(text);
	return containerEl;
};
const outputEl = document.getElementById("output") as HTMLElement;
const view = new HTMLView<number>(model, toHtml, outputEl);
