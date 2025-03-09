import { createEditor } from "./editor";
import "./style.css";

const editorNode = document.getElementById("editor")!;
const editor = createEditor(editorNode);

console.log(editor);
