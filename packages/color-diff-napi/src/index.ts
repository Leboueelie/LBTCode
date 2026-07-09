export type SyntaxTheme = {
  added: string
  removed: string
  context: string
  lineNumber: string
}

const defaultTheme: SyntaxTheme = {
  added: 'green',
  removed: 'red',
  context: 'dim',
  lineNumber: 'gray',
}

export class ColorDiff {
  static fromStrings(
    before: string,
    after: string,
    options?: { context?: number; theme?: SyntaxTheme }
  ) {
    return new ColorDiff(before, after, options)
  }

  constructor(
    public before: string,
    public after: string,
    public options?: { context?: number; theme?: SyntaxTheme }
  ) {}

  get unified(): string {
    return `--- a\n+++ b\n@@ -1 +1 @@\n ${this.before}\n ${this.after}`
  }
}

export class ColorFile {
  constructor(
    public path: string,
    public content: string
  ) {}
}

export function getSyntaxTheme(theme?: Partial<SyntaxTheme>): SyntaxTheme {
  return { ...defaultTheme, ...theme }
}
