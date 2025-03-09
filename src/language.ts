import { StreamLanguage, StreamParser } from "@codemirror/language";
import { commandRegistry } from "./command";

const cowParser: StreamParser<void> = {
  token(stream) {
    if (stream.eatSpace()) {
      return null;
    }

    if (stream.eatWhile(/[\w]+/)) {
      const name = stream.current();
      return commandRegistry.getByName(name) ? "keyword" : "comment";
    }

    return null;
  },
  languageData: {
    autocomplete: [...commandRegistry.names],
  },
};

export const cowLang = StreamLanguage.define(cowParser);
