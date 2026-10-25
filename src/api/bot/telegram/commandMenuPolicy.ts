export interface CommandMenuEntry {
  command: string;
  description: string;
}

export interface CommandMenuItem {
  command: string;
  description: string;
  hidden?: boolean;
}

export const buildCommandMenu = (
  commands: readonly CommandMenuItem[],
): CommandMenuEntry[] =>
  commands
    .filter((command) => !command.hidden)
    .map((command) => ({
      command: command.command,
      description: command.description,
    }));
