## Query Parameters with Function-like APIs

Some query parameters have more complex APIs, which are defined by a collection of typescript function singatures (limited to only `string`, `boolean`, and `number` arguments), like:

```ts
const definitions = [
  "method(arg1: string, arg2: boolean, arg3?: number)",
  "otherMethod(arg1: string, arg2?: boolean, arg3?: number)"
]
```

These APIs are utilized when setting the query parameter with a _function-like_ invocation syntax, such as:

```md
[](<url>?example=method(hello-world,true))
```

As you can maybe tell from the example above, we're relaxing some constraints on typical function invocations (like the need to wrap string arguments in quotes), while also imposing some additional constraints (like not using spaces) to ensure the links are valid markdown and the URLs are [safe](https://support.exactonline.com/community/s/knowledge-base?language=en_GB#All-All-DNO-Content-urlcharacters).

The goal is to make it as painless as possible to author links that are valid markdown, valid URLs, and easy to read and write.

Please note the following:

- Methods that take no arguments can be invoked without parentheses (e.g. `[](<url>?example=method)`).
- String arguments do not need to be wrapped in quotes (e.g. `[](<url>?example=method(some-string))`), and they should **NOT** be wrapped in double quotes (see more below).
- You cannot use spaces within a string argument or anywhere else in the query (as this would violate the markdown link syntax). For arguments that reasonably could include spaces, there should be an optional `space` argument that defaults to `-`, so that any usage of the space character will be converted to a space (e.g. `hello-world` becomes `hello world`).
- If a method takes a string argument, and you want to include a comma within that argument, you must wrap it in one or more single quotes (`'`). 
- String arguments wrapped in single set of single quotes will automatically have their single quotes removed when the query is parsed (e.g. the argument included in `[](<url>?example=method('hello,world'))` will parse to `hello,world`).
- If you want single quotes preserved in the parsed output, use two single quotes in a row (e.g. `[](<url>?example=method(''single-quoted''))`). 
- You cannot use double quotes within a string argument (as they are not a [URL safe character](https://support.exactonline.com/community/s/knowledge-base#All-All-DNO-Content-urlcharacters)). To include a double-quote in the parsed output, use three single quotes in a row (e.g. `[](<url>?example=method'''double-quoted'''))`).
- Optional arguments can be completely ommitted (for example if a `method` took 3 optional arguments, and you only wanted to provide the third, you could do the following: `[](<url>?example=method(,,your-third-argument))`).
- Overall, text meant to be displayed to a human will be _sanitized_ in the following manner (unless otherwise noted):

[](../src/utils.ts?region=extract(sanitize))