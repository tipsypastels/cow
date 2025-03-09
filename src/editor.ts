import { basicSetup, EditorView } from "codemirror";
import { cowLang } from "./language";

const STORAGE_KEY = "cow_doc";

export function createEditor(parent: HTMLElement) {
  const doc = localStorage.getItem(STORAGE_KEY) ?? "";

  const updateListener = EditorView.updateListener.of((event) => {
    if (event.docChanged) {
      localStorage.setItem(STORAGE_KEY, event.state.sliceDoc());
    }
  });

  return new EditorView({
    doc,
    parent,
    extensions: [basicSetup, updateListener, cowLang],
  });
}
