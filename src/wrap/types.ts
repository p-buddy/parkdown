export type TypeRecord = {
  "string": string,
  "number": number,
  "boolean": boolean,
}

type ExpandRecursively<T> =
  T extends (...args: infer A) => infer R
  /**/ ? (...args: ExpandRecursively<A>) => ExpandRecursively<R>
  /**/ : T extends object
    /**/ ? T extends infer O
      /**/ ? { [K in keyof O]: ExpandRecursively<O[K]> }
      /**/ : never
    /**/ : T;

type WithoutLeadingWhitespace<T extends string> = T extends ` ${infer Without}` ? Without : T;

type SplitOn<T extends string, Delimeter extends string> =
  T extends `${infer Left}${Delimeter}${infer Right}` ? [Left, ...SplitOn<Right, Delimeter>] : [T];

type RepeatInTuple<Element, Count extends number, Acc extends unknown[] = []> = {
  [k in Count]: Acc['length'] extends k
  ? Acc
  : RepeatInTuple<Element, k, [...Acc, Element]>;
}[Count];

type Join<T extends string[], D extends string> =
  T extends []
    /**/ ? ''
    /**/ : T extends [infer F extends string]
      /**/ ? F
      /**/ : T extends [infer F extends string, ...infer R extends string[]]
        /**/ ? `${F}${D}${Join<R, D>}`
        /**/ : string;

type Capture<T extends string, Start extends string, End extends string> = {
  [k in T]: k extends `${infer Before}${Start}${infer Captured}${End}${infer After}`
  /**/ ? { before: Before, captured: Captured, after: After }
  /**/ : { before: T, captured: "", after: "" };
}[T]

type SplitOnComma<T extends string> = { [k in SplitOn<T, ",">[number]]: k }[SplitOn<T, ",">[number]];

type Parameter<Name extends string, Optional extends boolean, Type extends TypeRecord[keyof TypeRecord]> = { name: Name, optional: Optional, type: Type };

type ExtractParameter<T extends string> = T extends `${infer Name}?: ${infer Type extends keyof TypeRecord}`
/**/ ? Parameter<Name, true, Type>
/**/ : T extends `${infer Name}: ${infer Type extends keyof TypeRecord}`
  /**/ ? Parameter<Name, false, Type>
  /**/ : never;

type FunctionName<T extends string> = Capture<T, "(", ")">["before"];

type ParameterRecord<T extends string> = {
  [k in WithoutLeadingWhitespace<SplitOnComma<Capture<T, "(", ")">["captured"]>> as ExtractParameter<k>["name"]]: ExtractParameter<k>["optional"] extends true ? TypeRecord[ExtractParameter<k>["type"]] | undefined : TypeRecord[ExtractParameter<k>["type"]]
}

type UndefinedToOptional<T> = {
  [K in keyof T as undefined extends T[K] ? K : never]?: Exclude<T[K], undefined>;
} & {
  [K in keyof T as undefined extends T[K] ? never : K]: T[K];
};

type ParseMethodDefinition<T extends string> = { [t in T as FunctionName<t>]: UndefinedToOptional<ParameterRecord<t>> };

type ParameterDefinition = `${string}${"?" | ""}: ${keyof TypeRecord}`;
/** Can add more parameters by adding more numbers to the count union, but it adds a lot of complexity to the type */
type ZeroOrMoreParameters = Join<RepeatInTuple<ParameterDefinition, 0 | 1 | 2>, ", ">;
export type MethodDefinition = `${string}(${ZeroOrMoreParameters})`;

export type MethodDefinitions = string[] | readonly string[];

export type ParsingCandidates<T extends MethodDefinitions> = ExpandRecursively<{
  [k in keyof ParseMethodDefinition<T[number]>]: ParseMethodDefinition<T[number]>[k] & { name: k }
}[keyof ParseMethodDefinition<T[number]>]>;

export type CreateParser = <T extends MethodDefinitions>(definitions: T) => ((query: string) => ParsingCandidates<typeof definitions>);