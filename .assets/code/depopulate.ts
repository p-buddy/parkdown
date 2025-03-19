import { depopulateMarkdownInclusions } from /** p↓: pkg */ "../../src" /** p↓: pkg */;

const file = "README.md";
const writeFile = true;

depopulateMarkdownInclusions(file, writeFile);