import { Tree } from "ts-tree";
import { View } from "../src/View";
import { Model } from "../src/Model";

const tree = new Tree(1, [
	new Tree(2, [new Tree(3, [new Tree(4)])]),
	new Tree(5),
	new Tree(6),
	new Tree(7)
]);

const tree2 = new Tree(9, [new Tree(10)]);

const model = new Model<number>(tree, t => false, (a, b) => (a < b ? -1 : a > b ? 1 : 0));
const toHtml = (v: number) => {
	const text = document.createTextNode(v.toString());
	const containerEl = document.createElement("div");
	containerEl.appendChild(text);
	return containerEl;
};
const outputEl = document.getElementById("output") as HTMLElement;
const view = new View<number>(model, toHtml, outputEl);
view.init();

const changeValueButton = document.getElementById("change-value") as HTMLElement;
changeValueButton.addEventListener("click", e => {
	const newValue = prompt("Please enter a new value");
	if (newValue) {
		model.setValue(parseInt(newValue));
	}
});

const changeRootButton = document.getElementById("change-root") as HTMLElement;
changeRootButton.addEventListener("click", e => {
	model.setRoot(tree2);
});
