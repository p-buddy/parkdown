import { depopulateMarkdownInclusions } from "../../src";

const file = "README.md";
const writeFile = true;

depopulateMarkdownInclusions(file, writeFile);