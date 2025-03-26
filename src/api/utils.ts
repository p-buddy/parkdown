import type { CreateParser, MethodDefinitions, ParsingCandidates, TypeRecord } from "./types";

const supportedTypes = ["string", "number", "boolean"] as const satisfies (keyof TypeRecord)[];

const isSupportedType = (type: string): type is keyof TypeRecord => supportedTypes.includes(type as keyof TypeRecord);

// This regex is used to parse function-like invocations such as "code(ts,some-meta)"
// Breaking down the regex pattern:
// ^ - Asserts position at the start of the string
// ([a-zA-Z0-9_-]+) - Capture group 1: The function name
//   [a-zA-Z0-9_-]+ - One or more alphanumeric characters, underscores, or hyphens
// (?:\(([^)]*)\))? - Optional non-capturing group for the parameters section
//   \( - Literal opening parenthesis
//   ([^)]*) - Capture group 2: Zero or more characters that are not closing parentheses
//   \) - Literal closing parenthesis
//   ? - Makes the entire parameter section optional
// $ - Asserts position at the end of the string
const INVOCATION_REGEX = /^([a-zA-Z0-9_-]+)(?:\(([^)]*)\))?$/;

export const parseInvocation = (input: string): { name: string, parameters: (string | undefined)[] } => {
  const match = input.match(INVOCATION_REGEX);
  if (!match) throw new Error(`Invalid invocation: ${input}`);

  const [, name, rawParams = ""] = match;

  if (!rawParams.trim()) return { name, parameters: [] };

  const parameters = splitOnUnquotedComma(rawParams);
  return { name, parameters };
}

const restIsUndefined = <T>(arr: T[], index: number) => {
  for (let i = index + 1; i < arr.length; i++)
    if (arr[i] !== undefined) return false;
  return true;
}

export const splitOnUnquotedComma = (input: string): (string | undefined)[] => {
  const result: (string | undefined)[] = [];

  let current = "";
  let inSingleQuotes = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    const isSingleQuote = ch === "'";

    if (isSingleQuote && input.at(i + 1) === "'") {
      const triple = input.at(i + 2) === "'";
      inSingleQuotes = !inSingleQuotes;
      current += triple ? "'''" : "''";
      i += triple ? 2 : 1;
    } else if (isSingleQuote) {
      inSingleQuotes = !inSingleQuotes;
      current += ch;
    } else if (ch === "," && !inSingleQuotes) {
      result.push(current.trim());
      current = "";
    } else current += ch;
  }

  result.push(current.trim());

  return result
    .map(item => item === "" ? undefined : item ? stripSurroundingSingleQuotes(item) : undefined)
    .filter((item, index, arr) => item !== undefined || !restIsUndefined(arr, index));
}

const stripSurroundingSingleQuotes = (input: string): string => {
  const isWrapped = input.length >= 2 && input[0] === "'" && input.at(-1) === "'";
  const isDoubleWrapped = isWrapped && (input.length >= 4 && input[1] === "'" && input.at(-2) === "'");
  return !isWrapped || isDoubleWrapped ? input : input.slice(1, -1);
};

type ParsedParameterDefinition = { name: string; optional: boolean; type: keyof TypeRecord };
type ParsedMethodDefinition = { name: string; parameters?: ParsedParameterDefinition[] };

export const parseDefinition = <T extends string>(definition: T): ParsedMethodDefinition => {
  // Match a method definition pattern:
  // ^ - start of string
  // ([\w-_]+) - capture group 1: one or more word characters or hyphens or underscores (method name)
  // (?:\(([^)]*)\))? - optional non-capturing group:
  //   \( - literal opening parenthesis
  //   ([^)]*) - capture group 2: zero or more characters that are not closing parenthesis (parameter list)
  //   \) - literal closing parenthesis
  const METHOD_REGEX = /^([\w-_]+)(?:\(([^)]*)\))?/;

  const methodMatch = definition.match(METHOD_REGEX);
  if (!methodMatch) return { name: definition };

  const [, methodName, paramString] = methodMatch;

  if (!paramString) return { name: methodName };

  // ([\w-_]+)    - Capture group 1: One or more word characters or hyphens or underscores (parameter name)
  // (\?)?    - Capture group 2: Optional question mark (indicates optional parameter)
  // :        - Literal colon character
  // \s*      - Zero or more whitespace characters
  // ([^,]+)  - Capture group 3: One or more characters that are not commas (parameter type)
  // /g       - Global flag: Find all matches in the string, not just the first one
  const PARAM_REGEX = /([\w-_]+)(\?)?:\s*([^,]+)/g;

  const parameters: ParsedParameterDefinition[] = [];

  let match: RegExpExecArray | null;
  while ((match = PARAM_REGEX.exec(paramString)) !== null) {
    const [, name, optSymbol, paramType] = match;
    const type = paramType.trim();
    if (!isSupportedType(type)) throw new Error(`Unsupported type: ${type}`);
    parameters.push({ name, optional: optSymbol === "?", type });
  }

  return { name: methodName, parameters };
}

export const createParser: CreateParser = <T extends MethodDefinitions>(definitions: T) => {
  const parsedDefinitions = definitions
    .map(parseDefinition)
    .reduce(
      (map, { name, parameters }) => map.set(name, parameters),
      new Map<string, ParsedParameterDefinition[] | undefined>()
    );
  return (query: string) => {
    const { name, parameters } = parseInvocation(query);
    if (!parsedDefinitions.has(name))
      throw new Error(`Unknown method: ${name}`);

    const parameterDefinitions = parsedDefinitions.get(name);
    if (parameterDefinitions === undefined)
      return { name } satisfies ParsingCandidates<[string]> as ParsingCandidates<T>;

    if (parameters.length > parameterDefinitions.length) {
      const requiredCount = parameterDefinitions.filter(({ optional }) => !optional).length;
      const expected = requiredCount === parameterDefinitions.length
        ? requiredCount.toString()
        : `${requiredCount} - ${parameterDefinitions.length}`;
      throw new Error(`Too many parameters: ${parameters.length} for method '${name}' (expected: ${expected})`);
    }

    return parameterDefinitions.reduce((acc, { name: param, optional, type }, index) => {
      const value = parameters[index];

      if (value === undefined)
        if (optional) return acc;
        else throw new Error(`Missing required parameter: ${param} for method '${name}'`);

      switch (type) {
        case "string":
          acc[param] = value;
          break;
        case "number":
        case "boolean":
          acc[param] = JSON.parse(value);
          break;
      }
      if (typeof acc[param] !== type)
        throw new Error(`Invalid type: ${param} must be ${type}, got ${typeof acc[param]} for method '${name}'`);
      return acc;
    }, { name } as ParsingCandidates<T>);
  }
}