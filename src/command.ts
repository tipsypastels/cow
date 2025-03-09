import type { Cow } from "./interpreter";

export type BadEval =
  | { type: "invalidCommand"; value: number }
  | { type: "evalLoop" };

export interface Command {
  (cow: Cow): void;
}

/**
 * Jump to the previous `MOO` instruction, unless `MOO` is the
 * command immediately before this in which case it jumps to the
 * one before that. Does nothing if no `MOO` is found.
 */
const moo: Command = (cow) => {
  cow.skipBackUntil((c, i) => i < (cow.progcnt - 1) && c === MOO);
};

/**
 * Move the cursor backwards.
 */
const mOo: Command = (cow) => {
  cow.cursor -= 1;
};

/**
 * Move the cursor forwards.
 */
const moO: Command = (cow) => {
  cow.cursor += 1;
};

/**
 * Execute the current value as a command. Exit the program if
 * it is invalid, or `3`, which would cause an infinite loop.
 */
const mOO: Command = (cow) => {
  const { value } = cow;
  const command = commandRegistry.getById(value);
  if (!command) {
    return cow.badEval({ type: "invalidCommand", value });
  }
  if (command === cow.command) {
    return cow.badEval({ type: "evalLoop" });
  }
  command(cow);
};

/**
 * If the current value is zero, read a single ASCII char and
 * set the value to that. If nonzero, write the current value
 * as an ASCII char instead.
 */
const Moo: Command = (cow) => {
  if (cow.value === 0) {
    cow.value = cow.io.readChar();
  } else {
    cow.io.writeChar(cow.value);
  }
};

/**
 * Decrement the current value.
 */
const MOo: Command = (cow) => {
  cow.value -= 1;
};

/**
 * Increase the current value.
 */
const MoO: Command = (cow) => {
  cow.value += 1;
};

/**
 * If the current value is zero, skip to the next `moo`, unless `moo`
 * is the very next command in which case use the one after that. If
 * no `moo` is found, exit. If the current value is nonzero, do nothing.
 */
const MOO: Command = (cow) => {
  if (cow.value === 0) {
    cow.skipNextThenToAfterEndpoint();
  }
};

/**
 * Zero the current value.
 */
const OOO: Command = (cow) => {
  cow.value = 0;
};

/**
 * If the register is empty, set register to current value. If the
 * register is not empty, set the current value to the register's,
 * then clear the register.
 */
const MMM: Command = (cow) => {
  if (cow.register === null) {
    cow.register = cow.value;
  } else {
    cow.value = cow.register;
    cow.register = null;
  }
};

/**
 * Write current value as an integer.
 */
const OOM: Command = (cow) => {
  cow.io.writeByte(cow.value);
};

/**
 * Read current value as an integer.
 */
const oom: Command = (cow) => {
  cow.value = cow.io.readByte();
};

export const commandRegistry = makeCommandRegistry();

function makeCommandRegistry() {
  let i = 0;

  const idMap = new Map<number, Command>();
  const nameMap = new Map<string, Command>();

  const add = (command: Command) => {
    idMap.set(i++, command);
    nameMap.set(command.name, command);
  };

  add(moo);
  add(mOo);
  add(moO);
  add(mOO);
  add(Moo);
  add(MOo);
  add(MoO);
  add(MOO);
  add(OOO);
  add(MMM);
  add(OOM);
  add(oom);

  return {
    get names() {
      return nameMap.keys();
    },
    getById(id: number) {
      return idMap.get(id);
    },
    getByName(name: string) {
      return nameMap.get(name);
    },
  };
}
