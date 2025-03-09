import EventEmitter from "eventemitter3";
import type { BadEval, Command } from "./command";

type Skip =
  | typeof SKIP_NEXT_THEN_TO_AFTER_ENDPOINT
  | typeof SKIP_TO_AFTER_ENDPOINT;

const SKIP_NEXT_THEN_TO_AFTER_ENDPOINT = Symbol();
const SKIP_TO_AFTER_ENDPOINT = Symbol();

export interface CowOptions {
  io?: Partial<CowIo>;
  commands: Command[];
  memorySize: number;
}

export interface CowEvents {
  valueChanged: [value: number];
  cursorChanged: [cursor: number];
  registerChanged: [register: number | null];
  badEval: [info: BadEval];
  done: [];
}

export class Cow {
  #io: CowIo;
  #events = new EventEmitter<CowEvents>();

  #program: Command[];
  #memory: Uint8Array;

  #cursor = 0;
  #progcnt = 0;
  #register: number | null = null;

  #skip: Skip | null = null;
  #break = false;
  #done = false;
  #justJumped = false;

  constructor(options: CowOptions) {
    this.#io = Object.assign({}, DEFAULT_COW_IO, options.io);
    this.#program = options.commands;
    this.#memory = new Uint8Array(options.memorySize);
  }

  on<K extends keyof CowEvents>(key: K, func: (...args: CowEvents[K]) => void) {
    this.#events.on(key, func);
  }

  next() {
    if (this.#done) {
      return;
    }

    const command = this.command;
    if (command == null) {
      return;
    }

    switch (this.#skip) {
      case SKIP_NEXT_THEN_TO_AFTER_ENDPOINT: {
        this.#skip = SKIP_TO_AFTER_ENDPOINT;
        break;
      }
      case SKIP_TO_AFTER_ENDPOINT: {
        this.#skip = null;
        break;
      }
      default: {
        command(this);
      }
    }

    this.#incrementProgcnt();
    this.#checkIfDone();
  }

  get done() {
    return this.#done;
  }

  #incrementProgcnt() {
    if (this.#justJumped) {
      // don't increment progcnt since it was just set manually
      this.#justJumped = false;
    } else {
      this.#progcnt++;
    }
  }

  #checkIfDone() {
    if (this.#done) {
      return;
    }
    if (this.#break || this.command == null) {
      this.#done = true;
      this.#events.emit("done");
    }
  }

  get value() {
    return this.#memory[this.#cursor];
  }

  set value(value: number) {
    this.#memory[this.#cursor] = value;
    this.#events.emit("valueChanged", value);
  }

  get cursor() {
    return this.#cursor;
  }

  set cursor(cursor: number) {
    this.#cursor = cursor;
    this.#events.emit("cursorChanged", cursor);
  }

  get register() {
    return this.#register;
  }

  set register(register: number | null) {
    this.#register = register;
    this.#events.emit("registerChanged", register);
  }

  get command(): Command | undefined {
    return this.#program[this.#progcnt];
  }

  get progcnt() {
    return this.#progcnt;
  }

  get io() {
    return this.#io;
  }

  skipBackUntil(f: (command: Command, i: number) => boolean) {
    const index = this.#program.findLastIndex(f);
    if (index > -1) {
      this.#progcnt = index;
      this.#justJumped = true;
    }
  }

  skipNextThenToAfterEndpoint() {
    this.#skip = SKIP_NEXT_THEN_TO_AFTER_ENDPOINT;
  }

  badEval(info: BadEval) {
    this.#events.emit("badEval", info);
    this.#break = true;
  }
}

interface CowIo {
  readChar(): number;
  readByte(): number;
  writeChar(charCode: number): void;
  writeByte(byte: number): void;
}

const DEFAULT_COW_IO: CowIo = {
  readChar() {
    while (true) {
      const s = prompt("Enter a single ASCII character.");
      if (!s || s.length !== 1) {
        alert("Invalid input.");
        continue;
      }
      return s.charCodeAt(0);
    }
  },
  readByte() {
    while (true) {
      const s = prompt("Enter a number");
      if (!s || isNaN(+s)) {
        alert("Invalid input.");
        continue;
      }
      return +s;
    }
  },
  writeChar(charCode) {
    console.log(">", String.fromCharCode(charCode));
  },
  writeByte(byte) {
    console.log(">", byte);
  },
};
