import { processMarkdownIncludes } from "../src";

const file = "README.md";
const writeFile = true;

processMarkdownIncludes(file, writeFile);