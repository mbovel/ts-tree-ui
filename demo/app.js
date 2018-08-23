!function(e){var t={};function r(s){if(t[s])return t[s].exports;var i=t[s]={i:s,l:!1,exports:{}};return e[s].call(i.exports,i,i.exports,r),i.l=!0,i.exports}r.m=e,r.c=t,r.d=function(e,t,s){r.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:s})},r.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},r.t=function(e,t){if(1&t&&(e=r(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var s=Object.create(null);if(r.r(s),Object.defineProperty(s,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var i in e)r.d(s,i,function(t){return e[t]}.bind(null,i));return s},r.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return r.d(t,"a",t),t},r.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},r.p="",r(r.s=0)}([function(e,t,r){e.exports=r(1)},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});const s=r(2),i=r(3),n=new(r(4).Model)(new s.Tree(1,[new s.Tree(2,[new s.Tree(3,[new s.Tree(4)])]),new s.Tree(5),new s.Tree(6),new s.Tree(7)]),e=>!1,(e,t)=>e<t?-1:e>t?1:0),o=document.getElementById("output");new i.HTMLView(n,e=>{const t=document.createTextNode(e.toString()),r=document.createElement("div");return r.appendChild(t),r},o)},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});class s{constructor(e,t=[]){this.value=e,this._children=t;for(const e of t)e.remove(),e._parent=this}get children(){return this._children}get parent(){return this._parent}get root(){return this._parent?this._parent.root:this}get nextSibling(){if(this._parent)return this._parent._children[this._parent._children.indexOf(this)+1]}get previousSibling(){if(this._parent)return this._parent._children[this._parent._children.indexOf(this)-1]}get firstChild(){return this._children[0]}get lastChild(){return this._children[this._children.length-1]}get previous(){const e=this.previousSibling;return e?e.lastDescendant||e:this._parent}get lastDescendant(){const e=this.lastChild;if(e)return e.lastDescendant||e}get next(){return this.firstChild||this.nextSibling||this.parentNext}get parentNext(){if(this._parent)return this._parent.nextSibling||this._parent.parentNext}after(e){if(this._parent)return this._parent.insertAfter(this,e)}before(e){if(this._parent)return this._parent.insertBefore(this,e)}remove(){if(this._parent)return this._parent.removeChild(this)}appendChild(e){return this.insertBefore(void 0,e)}insertAfter(e,t){return this.insertBefore(e?e.nextSibling:this.firstChild,t)}insertBefore(e,t){const r=e?this._children.indexOf(e):this._children.length;if(r>=0)return t.remove(),this._children.splice(r,0,t),t._parent=this,t}removeChild(e){const t=this._children.indexOf(e);if(t>=0)return this._children.splice(t,1),e._parent=void 0,e}isBefore(e){if(this===e)return 0;const t=[...this.ancestors(),this],r=[...e.ancestors(),e],s=Math.min(t.length,r.length);for(let e=0;e<s;++e){const s=t[e],i=r[e];if(s!==i){const r=t[e]._parent;if(!r)return 0;const n=r._children;return n.indexOf(s)<n.indexOf(i)?-1:1}}return t.length<r.length?-1:1}isChildOf(e){return this.parent===e||!!this.parent&&this.parent.isChildOf(e)}sortChildren(e){this._children.sort((t,r)=>e(t.value,r.value))}clone(){return new s(this.value,this._children.map(e=>e.clone()))}*childrenAfter(e){const t=this._children.length;for(let r=this._children.indexOf(e)+1;r<t;++r)yield this._children[r]}*childrenBefore(e){for(let t=this._children.indexOf(e)-1;t>=0;--t)yield this._children[t]}*previousSiblings(){this._parent&&(yield*this._parent.childrenBefore(this))}*nextSiblings(){this._parent&&(yield*this._parent.childrenAfter(this))}*descendants(){for(const e of this._children)yield e,yield*e.descendants()}*ancestors(){this._parent&&(yield*this._parent.ancestors(),yield this._parent)}}t.Tree=s},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});const s=navigator.platform.toUpperCase().indexOf("MAC")>=0;t.HTMLView=class{constructor(e,t,r){this.model=e,this.valueToHtmlEl=t,this.rootUlEl=r,this.treeToHtmlEl=new Map,this.htmlElToTree=new Map,this.cursorEl=null,this.modelEventHandler=this.handleModelEvent.bind(this),this.mousedownEventHandler=this.handleMousedownEvent.bind(this),this.mouseupEventHandler=this.handleMouseupEvent.bind(this),this.keyboardEventHandler=this.handleKeyboardEvent.bind(this),this.dragstartEventHandler=this.handleDragstartEvent.bind(this),this.dragenterEventHandler=this.handleDragenterEvent.bind(this),this.dragendEventHandler=this.handleDragendEvent.bind(this),this.model.subscribe(this.modelEventHandler),document.addEventListener("mousedown",this.mousedownEventHandler),document.addEventListener("mouseup",this.mouseupEventHandler),document.addEventListener("keydown",this.keyboardEventHandler),document.addEventListener("dragstart",this.dragstartEventHandler),document.addEventListener("dragenter",this.dragenterEventHandler),document.addEventListener("dragend",this.dragendEventHandler)}unbind(){this.model.unsubscribe(this.modelEventHandler),this.rootUlEl.removeEventListener("mousedown",this.mousedownEventHandler),this.rootUlEl.removeEventListener("mouseup",this.mouseupEventHandler),this.rootUlEl.removeEventListener("keydown",this.keyboardEventHandler),this.rootUlEl.removeEventListener("dragstart",this.dragstartEventHandler),this.rootUlEl.removeEventListener("dragenter",this.dragenterEventHandler),this.rootUlEl.removeEventListener("dragend",this.dragendEventHandler)}handleModelEvent(e){switch(e.type){case"insert":{const t=document.createElement("li");t.appendChild(this.valueToHtmlEl(e.tree.value));const r=document.createElement("ul");t.setAttribute("draggable","true"),t.appendChild(r);const s=e.tree.nextSibling?this.getHtmlEl(e.tree.nextSibling):null;(e.tree.parent?this.getHtmlEl(e.tree.parent).childNodes[1]:this.rootUlEl).insertBefore(t,s),this.htmlElToTree.set(t,e.tree),this.treeToHtmlEl.set(e.tree,t);break}case"remove":{const t=this.getHtmlEl(e.tree);if(!t.parentElement)throw new Error("Cannot remove root element");this.htmlElToTree.delete(t),this.treeToHtmlEl.delete(e.tree),t.parentElement.removeChild(t);break}case"add-to-selection":this.getHtmlEl(e.tree).classList.add("selected");break;case"remove-from-selection":this.getHtmlEl(e.tree).classList.remove("selected");break;case"move-cursor":this.cursorEl&&this.cursorEl.classList.remove("cursor"),e.tree?(this.cursorEl=this.getHtmlEl(e.tree),this.cursorEl.classList.add("cursor")):this.cursorEl=null}}handleMousedownEvent(e){const t=this.getTarget(e);t?e.ctrlKey||e.metaKey?this.model.selectToggle(t):e.shiftKey?this.model.selectUntil(t):this.model.isSelected(t)||this.model.selectOne(t):this.model.resetSelection()}handleMouseupEvent(e){const t=this.getTarget(e);t&&(e.ctrlKey||e.metaKey||e.shiftKey||this.model.isSelected(t)&&this.model.selectOne(t))}handleKeyboardEvent(e){if(e.ctrlKey||e.metaKey)switch(e.key){case"a":e.preventDefault(),this.model.selectAll();break;case"c":e.preventDefault(),this.model.copy();break;case"v":e.preventDefault(),this.model.paste()}else switch(e.key){case"ArrowUp":e.preventDefault(),this.model.selectPrev();break;case"ArrowDown":e.preventDefault(),this.model.selectNext();break;case"ArrowRight":for(const e of this.model.selectedSubtrees)this.getHtmlEl(e).classList.remove("closed");break;case"ArrowLeft":for(const e of this.model.selectedSubtrees)this.getHtmlEl(e).classList.add("closed");e.preventDefault();break;case"Delete":e.preventDefault(),this.model.delete();break;case"Backspace":s&&(e.preventDefault(),this.model.delete())}}handleDragstartEvent(e){if(e.dataTransfer.setData("text/html","hello!!"),e.dataTransfer.dropEffect="move",this.getTarget(e)){this.mirrorEl=document.createElement("ul"),this.mirrorEl.classList.add("mirror");for(const e of this.model.selectedSubtrees){const t=this.getHtmlEl(e);this.mirrorEl.appendChild(t.cloneNode(!0))}document.body.appendChild(this.mirrorEl),e.dataTransfer.setDragImage(this.mirrorEl,0,0)}}handleDragenterEvent(e){const t=this.getTarget(e);if(this.overTree&&(this.getHtmlEl(this.overTree).classList.remove("over"),this.overTree=void 0),t&&!this.model.isLeaf(t)){for(const e of this.model.selectedSubtrees)if(t===e||t.isChildOf(e))return;this.getHtmlEl(t).classList.add("over"),this.overTree=t}}handleDragendEvent(e){this.mirrorEl&&this.mirrorEl.remove(),this.overTree&&(this.model.insertAllIn(this.overTree,this.model.selectedSubtrees),this.getHtmlEl(this.overTree).classList.remove("over"),this.overTree=void 0)}getTarget(e){if(e.target instanceof Node)for(let t=e.target;t;t=t.parentNode)if(t instanceof HTMLElement){const e=this.htmlElToTree.get(t);if(e)return e}}getHtmlEl(e){const t=this.treeToHtmlEl.get(e);if(!t)throw new Error("No such tree");return t}getNode(e){const t=this.htmlElToTree.get(e);if(!t)throw new Error("No such tree");return t}}},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});const s=r(5);t.Model=class{constructor(e,t,r){this.root=e,this.isLeaf=t,this.sort=r,this.clipboard=[],this.selection=new Set,this.pubsub=new s.PubSub}subscribe(e){this.pubsub.subscribe(e),this.emitTree(this.root)}unsubscribe(e){this.pubsub.unsubscribe(e)}get sortedSelection(){const e=[...this.selection];return e.sort((e,t)=>e.isBefore(t)),e}get selectedSubtrees(){const e=[];let t=null;for(const r of this.sortedSelection)t&&r.isChildOf(t)||(e.push(r),t=r);return e}isSelected(e){return this.selection.has(e)}isOnlySelected(e){return 1===this.selection.size&&this.selection.has(e)}selectOne(e){if(!e||1!==this.selection.size||!this.selection.has(e)){for(const e of this.selection)this.removeFromSelection(e);e?(this.addToSelection(e),this.setCursor(e)):this.ensureValidCursor()}}selectPrev(){this.cursor&&this.cursor.previous&&this.selectOne(this.cursor.previous)}selectNext(){this.cursor&&this.cursor.next&&this.selectOne(this.cursor.next)}selectToggle(e){this.selection.has(e)?this.unselect(e):(this.addToSelection(e),this.setCursor(e))}selectUntil(e){if(!this.cursor)return;const t=e.isBefore(this.cursor)<0;let r=t?e:this.cursor.next;const s=t?this.cursor:e.next;for(;r&&r!==s;)this.addToSelection(r),r=r.next;this.setCursor(e)}selectAll(){for(let e=this.root;e;e=e.next)this.addToSelection(e)}resetSelection(){for(const e of this.selection)this.removeFromSelection(e);this.ensureValidCursor()}unselect(e){this.removeFromSelection(e),this.ensureValidCursor()}copy(){this.clipboard=this.selectedSubtrees.map(e=>e.clone())}paste(){this.cursor&&this.insertAllIn(this.cursor,this.clipboard.map(e=>e.clone()))}insertAllIn(e,t){const r=this.isLeaf(e),s=r?e.parent:e,i=r?e:void 0;if(s){for(const e of t.reverse())e.root===this.root&&this.remove(e),this.insertAfter(s,i,e);this.pubsub.emit({type:"tree-change",tree:this.root})}}delete(){for(const e of this.selectedSubtrees)this.remove(e);this.ensureValidCursor(),this.pubsub.emit({type:"tree-change",tree:this.root})}insertAfter(e,t,r){const s=e.children.find(e=>this.sort(e.value,r.value)>0);e.insertBefore(s,r),this.pubsub.emit({type:"insert",tree:r}),this.emitTree(r.firstChild)}remove(e){this.removeFromSelection(e),e.remove(),this.pubsub.emit({type:"remove",tree:e})}addToSelection(e){this.selection.has(e)||(this.selection.add(e),this.pubsub.emit({type:"add-to-selection",tree:e}))}removeFromSelection(e){this.selection.delete(e)&&this.pubsub.emit({type:"remove-from-selection",tree:e})}setCursor(e){e!==this.cursor&&this.pubsub.emit({type:"move-cursor",tree:e}),this.cursor=e}ensureValidCursor(){if(this.cursor&&this.cursor.root!==this.root){const e=this.selection.values().next();this.setCursor(e.done?void 0:e.value)}else this.setCursor(void 0)}emitTree(e){e&&(this.emitTree(e.nextSibling),this.pubsub.emit({type:"insert",tree:e}),this.emitTree(e.firstChild))}}},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});t.PubSub=class{constructor(){this.handlers=new Set}subscribe(e){this.handlers.add(e)}unsubscribe(e){this.handlers.delete(e)}emit(e){for(const t of this.handlers)t(e)}}}]);
//# sourceMappingURL=app.js.map