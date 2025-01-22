const RESET = "\x1b[0m";
const OUTPUT_FORMAT = "ansi-256";

// Predefined colors for convenience
const MAGENTA = Bun.color("#FF79C6", OUTPUT_FORMAT)!;
const CYAN = Bun.color("#8BE9FD", OUTPUT_FORMAT)!;
const GREEN = Bun.color("#50FA7B", OUTPUT_FORMAT)!;
const RED = Bun.color("#FF5555", OUTPUT_FORMAT)!;
const YELLOW = Bun.color("#F1FA8C", OUTPUT_FORMAT)!;
const BLACK = Bun.color("#6272A4", OUTPUT_FORMAT)!;

/**
 * Generic helper to wrap a string with a given color.
 * @param colorCode The ANSI color code to start with.
 * @param str The string to colorize.
 * @returns The colorized string.
 */
function colorize(colorCode: string, str: string): string {
  return `${colorCode}${str}${RESET}`;
}

const bunColors = {
  magenta(str: string): string {
    return colorize(MAGENTA, str);
  },
  cyan(str: string): string {
    return colorize(CYAN, str);
  },
  green(str: string): string {
    return colorize(GREEN, str);
  },
  red(str: string): string {
    return colorize(RED, str);
  },
  yellow(str: string): string {
    return colorize(YELLOW, str);
  },
  black(str: string): string {
    return colorize(BLACK, str);
  },
};

/**
 * Pads the start of a string up to a given length, without counting ANSI escape codes in the length.
 * @param str The string to pad.
 * @param targetLength The length of the resulting string after padding.
 * @param padChar The character to use for padding. Default is a space.
 * @returns The left-padded string, accounting for ANSI escape codes.
 */
export function padStartAnsi(
  str: string,
  targetLength: number,
  padChar: string = " "
): string {
  const stringWidth = Bun.stringWidth(str);
  // padStart uses total length, so we adjust by the ANSI-aware width
  return str.padStart(targetLength - stringWidth, padChar);
}

/**
 * Pads the end of a string up to a given length, without counting ANSI escape codes in the length.
 * @param str The string to pad.
 * @param targetLength The length of the resulting string after padding.
 * @param padChar The character to use for padding. Default is a space.
 * @returns The right-padded string, accounting for ANSI escape codes.
 */
export function padEndAnsi(
  str: string,
  targetLength: number,
  padChar: string = " "
): string {
  const stringWidth = Bun.stringWidth(str);
  const diff = targetLength - stringWidth;
  // padEnd pads based on the raw string length, so we calculate the needed difference
  return str.padEnd(str.length + diff, padChar);
}

export default bunColors;
