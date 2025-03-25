# parkdown (p↓)

`parkdown` allows you to include other file's content within your markdown using a link with no text (i.e. `[](<url>)`), where `<url>` corresponds to either:
  - a local file, e.g. `[](./other.md)` or `[](../root.ts)`
  - **_COMING SOON_**: An external link 

Markdown renderers shouldn't display these links, but [parkdown](https://www.npmjs.com/package/@p-buddy/parkdown) can process and populate them. Also, your editor hopefully makes these links easy to navigate to, improving productivity.

Collectively, [parkdown](https://www.npmjs.com/package/@p-buddy/parkdown) enables your documentation to behave a little more like code, and for your code to have a rightful place in your documentation.

[](./.assets/invocation.md)
<!-- p↓ BEGIN -->
<!-- p↓ length lines: 29 chars: 796 -->
## Invocation

Invoke [parkdown's]() functionality with either the [cli](#cli-inclusions) or via the `processMarkdownIncludes` [export](#populateMarkdownIncludes-export):

### CLI

The following commands are all equivalent:
```bash
npx @p-buddy/parkdown --file ./README.md
npx @p-buddy/parkdown -f README.md
npx @p-buddy/parkdown # defaults to processing inclusions in the 'README.md' file of the current working directory
```

### `populateMarkdownIncludes` export

[](.assets/code/inclusions.ts?region=replace(pkg,'''@p-buddy_slash_parkdown''',_))
<!-- p↓ BEGIN -->
<!-- p↓ length lines: 10 chars: 172 -->

```ts
import { populateMarkdownInclusions } from "@p-buddy/parkdown";

const file = "README.md";
const writeFile = true;

populateMarkdownInclusions(file, writeFile);
```

<!-- p↓ END -->
<!-- p↓ END -->

[](./.assets/authoring.md)
<!-- p↓ BEGIN -->
<!-- p↓ length lines: 663 chars: 22785 -->
## Authoring

You author inclusions in your markdown files using a link with no text i.e. `[](<url>)`, where `<url>` points to some local or remote text resource (e.g.`./other.md`, `https://example.com/remote.md`).

These links can be rendered either [inline](#inline) or [block](#block), depending on how you author them.

### Inline

Inline inclusions occur when your _text-less_ link has 1 or more siblings (meaning it's **not** the only node in a [paragraph](https://www.markdownguide.org/basic-syntax/#paragraphs-1)).

> **CAUTION:** [parkdown](https://www.npmjs.com/package/@p-buddy/parkdown) will not protect you from authoring inline inclusions that should actually be [block](#block) inclusions to be valid markdown.

There are two equivalent ways to author inline inclusions, [single-line](#single-line) or [multi-line](#multi-line), and which you choose depends solely on how you want your raw markdown to look (it will **not** affect the rendered output).

#### Single-line

What you write:

[](.assets/unpopulated/inline.single.md?wrap=code)
<!-- p↓ BEGIN -->
<!-- p↓ length lines: 5 chars: 40 -->

```md
Before... [](<url>) ...After
```

<!-- p↓ END -->

<details>
<summary>See rendering and processing output</summary>

What is rendered (**_before_** processing, same as [Multi-line](#multi-line)):

[](.assets/unpopulated/inline.single.md?wrap=quote&inline)
<!-- p↓ BEGIN -->
<!-- p↓ length lines: 1 chars: 30 -->
> Before... [](<url>) ...After
<!-- p↓ END -->

What your markdown file contains (**_after_** processing):

[](.assets/populated/inline.single.md?wrap=code)
<!-- p↓ BEGIN -->
<!-- p↓ length lines: 7 chars: 120 -->

```md
Before... [](<url>) <!-- p↓ Begin -->
...Included Content...
...Included Content... <!-- p↓ End --> ...After
```

<!-- p↓ END -->

What is rendered (**_after_** processing, same as [Multi-line](#multi-line)):

[](.assets/populated/inline.single.md?wrap=quote&inline)
<!-- p↓ BEGIN -->
<!-- p↓ length lines: 3 chars: 110 -->
> Before... [](<url>) <!-- p↓ Begin -->
...Included Content...
...Included Content... <!-- p↓ End --> ...After
<!-- p↓ END -->

</details>

#### Multi-line

What you write:

[](.assets/unpopulated/inline.multi.md?wrap=code)
<!-- p↓ BEGIN -->
<!-- p↓ length lines: 7 chars: 41 -->

```md
Before... 
[](<url>)
...After
```

<!-- p↓ END -->

<details>
<summary>See rendering and processing output</summary>

What is rendered (**_before_** processing, same as [Single-line](#single-line)):

[](.assets/unpopulated/inline.multi.md?wrap=quote&inline)
<!-- p↓ BEGIN -->
<!-- p↓ length lines: 3 chars: 31 -->
> Before... 
[](<url>)
...After
<!-- p↓ END -->

What your markdown file contains (**_after_** processing):

[](.assets/populated/inline.multi.md?wrap=code)
<!-- p↓ BEGIN -->
<!-- p↓ length lines: 9 chars: 122 -->

```md
Before... 
[](<url>) <!-- p↓ Begin -->
...Included Content...
...Included Content... <!-- p↓ End --> 
...After
```

<!-- p↓ END -->

What is rendered (**_after_** processing, same as [Single-line](#single-line)):

[](.assets/populated/inline.multi.md?wrap=quote&inline)
<!-- p↓ BEGIN -->
<!-- p↓ length lines: 5 chars: 112 -->
> Before... 
[](<url>) <!-- p↓ Begin -->
...Included Content...
...Included Content... <!-- p↓ End --> 
...After
<!-- p↓ END -->

</details>

### Block

Block inclusions occur when your "empty" link is the **only** node in a [paragraph](https://www.markdownguide.org/basic-syntax/#paragraphs-1) (at least before being populated). This is likely the most common way to author inclusions.

What you write:

[](.assets/unpopulated/block.md?wrap=code)
<!-- p↓ BEGIN -->
<!-- p↓ length lines: 9 chars: 42 -->

```md
Before...

[](<url>)

...After
```

<!-- p↓ END -->

<details>
<summary>See rendering and processing output</summary>

What is rendered (**_before_** processing):

[](.assets/unpopulated/block.md?wrap=quote)
<!-- p↓ BEGIN -->
<!-- p↓ length lines: 11 chars: 61 -->

<blockquote>

Before...

[](<url>)

...After

</blockquote>

<!-- p↓ END -->

What your markdown file contains (**_after_** processing):

[](.assets/populated/block.md?wrap=code)
<!-- p↓ BEGIN -->
<!-- p↓ length lines: 13 chars: 124 -->

```md
Before...

[](<url>)
<!-- p↓ Begin  -->
...Included Content...
...Included Content...
<!-- p↓ End  -->

...After
```

<!-- p↓ END -->

What is rendered (**_after_** processing):

[](.assets/populated/block.md?wrap=quote)
<!-- p↓ BEGIN -->
<!-- p↓ length lines: 15 chars: 143 -->

<blockquote>

Before...

[](<url>)
<!-- p↓ Begin  -->
...Included Content...
...Included Content...
<!-- p↓ End  -->

...After

</blockquote>

<!-- p↓ END -->

</details>

[](.assets/query.md?heading=-1)
<!-- p↓ BEGIN -->
<!-- p↓ length lines: 450 chars: 18079 -->
### Query parameters

You can pass query parameters to your inclusion links to control how their content is processed and included within your markdown.

#### Processing Order

[](src/include.ts?&region=extract(query))
<!-- p↓ BEGIN -->
<!-- p↓ length lines: 14 chars: 560 -->

```ts
const params = new URLSearchParams(query);
const entries = (key: string) => {
  const values = Array.from(params.entries()).filter(([k]) => k === key).map(([_, v]) => v);
  return values.length >= 1 ? values.join(",") : undefined;
};
          const regions = entries("region")?.split(COMMA_NOT_IN_PARENTHESIS);
          const skip = params.has("skip");
          const headingModfiier = params.get("heading") ?? 0;
          const inlineOverride = params.has("inline");
          const wraps = params.get("wrap")?.split(COMMA_NOT_IN_PARENTHESIS);
```

<!-- p↓ END -->

#### `region`

Either extract, remove, or replace content from the included file based on the provided specifier(s).

Specifiers will be searched for within the file's comments, and are expected to come in pairs / bookend the desired region, like so:

```ts
/** some-specifier */
... code to find ...
/** some-specifier */
```

Though comment regions can be nested, it is **CRITICAL** that regions that are retrieved with the _same_ specifier are **NOT** nested.

Identifiers will be searched for within the text of a comment, split by spaces (i.e. `/* some-specifier */` has a single identifier, but `/* some specifier */` can be identified by either `some` or `specifier`).

Below is the currently supported API for the `region` query parameter, where each defined method signature can be _invoked_ as a value for the `region` parameter, for example:

- `[](<url>?region=method(argument))`

If no value(s) are included (e.g. `[](<url>?region)`), then simply all comments that contain `parkdown:` or `p↓:` will be stripped (as is done as a post-processing step for all other `region` functionality).

[](.assets/api-note.md?wrap=quote)
<!-- p↓ BEGIN -->
<!-- p↓ length lines: 9 chars: 352 -->

<blockquote>

**_NOTE ON API USAGE:_** As you can see from the included examples, each _invocation_ of an API method looks like a less strict (more quirky) version of a typical javascript function invocation. 

Please see the [full explanation](#query-parameters-with-function-like-apis) to learn more and/or if the below is confusing.

</blockquote>

<!-- p↓ END -->

[](src/region.ts?region=extract(definition))
<!-- p↓ BEGIN -->
<!-- p↓ length lines: 122 chars: 6241 -->

```ts
const definitions = [

  /**
   * Extract regions from the retrieved content between comments that INCLUDE the specified ids.
   * @param id The id of the comment to extract.
   * @param 0 An optional additional id to extract.
   * @param 1 An optional additional id to extract.
   * @param 2 An optional additional id to extract.
   * @example [](<url>?region=extract(specifier))
   * @example [](<url>?region=extract(specifier,other-specifier,some-other-specifier))
   */
  "extract(id: string, 0?: string, 1?: string, 2?: string)",

  /**
   * Remove regions from the retrieved content between comments that INCLUDE the specified ids.
   * @param id The id of the comment to remove.
   * @param 0 An optional additional id to remove.
   * @param 1 An optional additional id to remove.
   * @param 2 An optional additional id to remove.
   * @example [](<url>?region=remove(specifier))
   * @example [](<url>?region=remove(specifier,other-specifier,some-other-specifier))
   */
  "remove(id: string, 0?: string, 1?: string, 2?: string)",

  /**
   * Replace regions from the retrieved content between comments that INCLUDE the specified ids.
   * @param id The id of the comment to replace.
   * @param with The replacement content (if ommitted, the content of the detected comment will be used).
   * @param space The space character to use between words in the replacement content (defaults to `-`).
   * @example [](<url>?region=replace(specifier))
   * @example [](<url>?region=replace(specifier,new-content))
   * @example [](<url>?region=replace(specifier,new_content,_)
   */
  "replace(id: string, with?: string, space?: string)",

  /**
   * Remap the content (similiar to `string.replaceAll`) within a specified comment region.
   * @param id The id of the comment regions to act on.
   * @param from The content to replace.
   * @param to The content to replace with.
   * @param space The space character to use between words in the content to replace (defaults to `-`).
   * @example [](<url>?region=remap(specifier,hello-world,hello-universe))
   * @example [](<url>?region=remap(specifier,hello_world,hello_universe,_)
   */
  "remap(id: string, from: string, to?: string, space?: string)",

  /**
   * Make the content of the region a single line (where all whitespace characters, including newlines, are converted to a single space).
   * @param id The id of the comment regions to act on.
   * @example [](<url>?region=single-line(specifier))
   */
  "single-line(id: string, includeBoundaries?: boolean)",

  /**
   * Trim the whitespace surrounding the comment boundaries of the region.
   * @param id The id of the comment region to act on.
   * @param inside Whether to trim the whitespace within the comment region. Defaults to `true`.
   * @param outside Whether to trim the whitespace outside the comment region. Defaults to `true`.
   * @example [](<url>?region=trim(specifier))
   * @example [](<url>?region=trim(specifier,false))
   * @example [](<url>?region=trim(specifier,,false))
   * @example [](<url>?region=trim(specifier,false,false))
   */
  "trim(id: string, inside?: boolean, outside?: boolean)",

  /**
   * Trim the whitespace surrounding the starting comment boundary of the specified region.
   * @param id The id of the comment region to act on.
   * @param left Whether to trim the whitespace to the left of the comment region. Defaults to `true`.
   * @param right Whether to trim the whitespace to the right of the comment region. Defaults to `true`.
   * @example [](<url>?region=trim-start(specifier))
   * @example [](<url>?region=trim-start(specifier,false))
   */
  "trim-start(id: string, left?: boolean, right?: boolean)",

  /**
   * Trim the whitespace surrounding the ending comment boundary of the specified region.
   * @param id The id of the comment region to act on.
   * @param left Whether to trim the whitespace to the left of the comment region. Defaults to `true`.
   * @param right Whether to trim the whitespace to the right of the comment region. Defaults to `true`.
   * @example [](<url>?region=trim-end(specifier))
   * @example [](<url>?region=trim-end(specifier,false))
   */
  "trim-end(id: string, left?: boolean, right?: boolean)",

  /**
   * Splice the retrieved content at the starting comment boundary of the specified region.
   * @param id The id of the comment region to act on.
   * @param deleteCount The number of characters to delete at either the beginning or end of the comment boundary.
   * Specifying a number greater than or equal to 0 indicates the action should be taken at the end of the comment boundary (i.e to the right of the comment).
   * Specifying undefined or a number less than 0 indicates the action should be taken at the beginning of the comment boundary (i.e to the left of the comment).
   * @param insert The content to insert.
   * @param space The space character to use between words in the content to insert (defaults to `-`).
   * 
   * **NOTE:** Content within comments will not be acted upon.
   */
  "splice-start(id: string, deleteCount?: number, insert?: string, space?: string)",

  /**
   * Splice the retrieved content at the ending comment boundary of the specified region.
   * @param id The id of the comment region to act on.
   * @param deleteCount The number of characters to delete at either the beginning or end of the comment boundary.
   * Specifying a number greater than or equal to 0 indicates the action should be taken at the end of the comment boundary (i.e to the right of the comment).
   * Specifying undefined or a number less than 0 indicates the action should be taken at the beginning of the comment boundary (i.e to the left of the comment).
   * @param insert The content to insert.
   * @param space The space character to use between words in the content to insert (defaults to `-`).
   * 
   * **NOTE:** Content within comments will not be acted upon.
   */
  "splice-end(id: string, deleteCount?: number, insert?: string, space?: string)",

  /**
   * If included at the end of a query, parkdown comments will not be removed from the content after processing. 
   * Helpful when trying to determine fine-grained edits (e.g. trimming, splicing, etc.).
   */
  "debug()"

]
```

<!-- p↓ END -->

#### `skip`

Skip the default processing behavior for the given type of file. 

[](src/include.ts?wrap=dropdown(See-default-processing-behavior.)&region=extract(Default-Behavior),replace(...))
<!-- p↓ BEGIN -->
<!-- p↓ length lines: 17 chars: 273 -->

<details>
<summary>
See default processing behavior.
</summary>

```ts
if (extension === "md") {
  * ...
  content = recursivelyPopulateInclusions(content, * ...);
}
else if (/^(js|ts)x?|svelte$/i.test(extension))
  content = wrap(content, "code", * ...);
```

</details>

<!-- p↓ END -->

```md
[](<url>?skip)
```

#### `heading` 

Modify the heading depth applied to included content. By default, the headings of the included content are adjusted to be one-level below their parent heading (i.e. the heading the included content falls under).

You might commonly see `[](<url>?heading=-1)` used to ensure that the included content's heading level is the same as it's parent heading.

<details>
<summary>
See example usage:
</summary>
Assuming you have the following markdown files:

```md
<!-- to-be-included.md -->
# Included Heading
```

```md
<!-- README.md -->
# Heading

[](./to-be-included.md)
```

When `README.md` is processed, it will be transformed into the following:

```md
# Heading

## Included Heading
```

Where the included content's heading has been modified to be one-level below the parent heading (i.e. it is converted from an `h1` / `#` heading to a `h2` / `##` heading — `h1 + 1 = h2`).

If we instead wanted the included heading to remain a `h1` / `#` heading, we'd make use of the `heading` query parameter with a value of `-1` (since `h1 + 1 - 1 = h1`), like so:

```md
<!-- README.md -->
# Heading

[](./to-be-included.md?heading=-1)
```

which would result in the following:

```md
# Heading

# Included Heading
```

</details>

#### `inline` (Advanced)

Force a replacement target to be treated as [inline](#inline) content.

#### `wrap`

Wrap the content of the included file in a specific kind of element.

Below is the currently supported API for the `wrap` query parameter, where each defined method signature can be _invoked_ as a value for the `wrap` parameter, for example:

- `[](<url>?wrap=code)`
- `[](<url>?wrap=dropdown(hello-world))`

[](.assets/api-note.md?wrap=quote)
<!-- p↓ BEGIN -->
<!-- p↓ length lines: 9 chars: 352 -->

<blockquote>

**_NOTE ON API USAGE:_** As you can see from the included examples, each _invocation_ of an API method looks like a less strict (more quirky) version of a typical javascript function invocation. 

Please see the [full explanation](#query-parameters-with-function-like-apis) to learn more and/or if the below is confusing.

</blockquote>

<!-- p↓ END -->

[](src/wrap.ts?region=extract(definition))
<!-- p↓ BEGIN -->
<!-- p↓ length lines: 38 chars: 1384 -->

```ts
const definitions = [
  /**
   * Wraps the content in a markdown-formatted code block.
   * @param lang The language of the code block (defaults to the file extension).
   * @param meta Additional metadata to include in the top line of the code block (i.e. to the right of the `lang`).
   * @example [](<url>?wrap=code)
   * @example [](<url>?wrap=code())
   * @example [](<url>?wrap=code(ts))
   * @example [](<url>?wrap=code(,some-meta))
   */
  "code(lang?: string, meta?: string)",

  /**
   * Wraps the content in a markdown-formatted blockquote 
   * (using the `>` character if the content is a single line, 
   * or the `<blockquote>` tag if the content is a multi-line block).
   * @example [](<url>?wrap=quote)
   * @example [](<url>?wrap=quote())
   * @example [](<url>?wrap=quote(,))
   */
  "quote()",

  /**
   * Wraps the content in a markdown-formatted dropdown (using the `<details>` and `<summary>` tags).
   * @param summary The summary text of the dropdown.
   * @param open Whether the dropdown should be open by default.
   * @param space The space character to use between words in the summary (defaults to `-`).
   * @example [](<url>?wrap=dropdown(hello-world))
   * @example [](<url>?wrap=dropdown('hello,-world',true))
   * @example [](<url>?wrap=dropdown(hello_world,,_)) 
   */
  "dropdown(summary: string, open?: boolean, space?: string)",

]
```

<!-- p↓ END -->

[](.assets/api.md?heading=-1)
<!-- p↓ BEGIN -->
<!-- p↓ length lines: 105 chars: 4993 -->
#### Query Parameters with Function-like APIs

Some query parameters have more complex APIs, which are defined by a collection of typescript function singatures (limited to only `string`, `boolean`, and `number` arguments), like:

```ts
const definitions = [
  "method(arg1: string, arg2: boolean, arg3?: number)",
  "otherMethod(arg1: string, arg2?: boolean, arg3?: number)"
]
```

These APIs are utilized when setting the value of the specific query parameter with a _function-like_ invocation syntax, such as:

```md
[](<url>?example=method(hello-world,true))
```

As you can see from the example above, we're relaxing some constraints on typical function invocations (like the need to wrap string arguments in quotes), while also imposing some additional constraints (like not using _any_ spaces) to ensure the links are valid markdown and the URLs are [safe](https://support.exactonline.com/community/s/knowledge-base?language=en_GB#All-All-DNO-Content-urlcharacters).

The goal is to make it as painless as possible to author links that are valid markdown, valid URLs, and easy to read and write.

Please note the following:

- Methods that take no arguments can be invoked without parentheses (e.g. `[](<url>?example=method)`).
- String arguments do not need to be wrapped in quotes (e.g. `[](<url>?example=method(some-string))`), and they **CANNOT** be wrapped in double quotes (see more below).
- You cannot use spaces within a string argument or anywhere else in the query (as this would violate the markdown link syntax). For arguments that reasonably could include spaces, there should be an optional `space` argument that defaults to `-`, so that any usage of the space character will be converted to a space (e.g. `hello-world` becomes `hello world`).
- Characters that are reserved or unsafe in URLs can be included by using the below remapping, where you'll write the corresponding key wrapped in the applicable `space` character (see the above bullet point, defaults to `-`). For example, if you want to use a `/`, you'd instead write `-slash-` (or with whatever you specify as your space character instead of `-`).

[](src/utils.ts?region=extract(url))
<!-- p↓ BEGIN -->
<!-- p↓ length lines: 32 chars: 518 -->

```ts
const urlCharacters = {
  reserved: {
    ["semi"]: ";",
    ["slash"]: "/",
    ["question"]: "?",
    ["colon"]: ":",
    ["at"]: "@",
    ["equal"]: "=",
    ["and"]: "&",
  },
  unsafe: {
    ["quote"]: "\"",
    ["angle"]: "<",
    ["unangle"]: ">",
    ["hash"]: "#",
    ["percent"]: "%",
    ["curly"]: "{",
    ["uncurly"]: "}",
    ["pipe"]: "|",
    ["back"]: "\\",
    ["carrot"]: "^",
    ["tilde"]: "~",
    ["square"]: "[",
    ["unsquare"]: "]",
    ["tick"]: "`",
    ["line"]: "\n",
  }
}
```

<!-- p↓ END -->

- If a method takes a string argument, and you want to include a comma within that argument, you must wrap it in one or more single quotes (e.g.`hello,-world` should be specified as `'hello,-world'`). 
- String arguments wrapped in a single set of single quotes will automatically have the quotes removed when the query is parsed (e.g. the argument included in `[](<url>?example=method('hello,world'))` will parse to `hello,world`).
- If you want single quotes preserved in the parsed output, use two single quotes in a row (e.g. `[](<url>?example=method(''single-quoted''))`). 
- You cannot use double quotes within a string argument (as they are not a [URL safe character](https://support.exactonline.com/community/s/knowledge-base#All-All-DNO-Content-urlcharacters)). To include a double-quote in the parsed output, use three single quotes in a row (e.g. `[](<url>?example=method('''double-quoted'''))`). Or use the remapping described above, like `[](<url>?example=method(-quote-double-quoted-quote-))`.
- Optional arguments can be completely ommitted (for example if a `method` took 3 optional arguments, and you only wanted to provide the third, you could do the following: `[](<url>?example=method(,,your-third-argument))`).
- Overall, text meant to be displayed will be _sanitized_ in the following manner (unless otherwise noted):

[](src/utils.ts?region=extract(sanitize))
<!-- p↓ BEGIN -->
<!-- p↓ length lines: 29 chars: 771 -->

```ts
type Replacement = [from: RegExp | string, to: string];

const replacements: Record<string, Replacement[]> = {
  static: [
    [`'''`, `"`],
    [`''`, `'`],
    [/parkdown:\s+/g, ``],
    [/p↓:\s+/g, ``],
  ],
  url: [
    ...(Object.entries(urlCharacters.unsafe)),
    ...(Object.entries(urlCharacters.reserved))
  ]
};

const applyReplacement = (accumulator: string, [from, to]: Replacement) =>
  accumulator.replaceAll(from, to);

export const sanitize = (content: string, space: string = DEFAULT_SPACE) => {
  const sanitized = replacements.static.reduce(applyReplacement, content)
  return replacements.url
    .map(([key, to]) => ([space + key + space, to] satisfies Replacement))
    .reduce(applyReplacement, sanitized)
    .replaceAll(space, " ");
}
```

<!-- p↓ END -->
<!-- p↓ END -->
<!-- p↓ END -->
<!-- p↓ END -->

[](./.assets/depopulated.md)
<!-- p↓ BEGIN -->
<!-- p↓ length lines: 38 chars: 1473 -->
## Removing populated inclusions

Sometimes you may want to remove populated inclusions from your markdown file, since they can make things more difficult to read during authoring. You can do this either using the [cli](#cli-removing-populated-inclusions) or via the `removePopulatedInclusions` [export](#depopulateMarkdownIncludes-export):

### CLI (removing populated inclusions)

The following commands are all equivalent:

```bash
npx @p-buddy/parkdown --file ./README.md --depopulate --no-inclusions
npx @p-buddy/parkdown -f README.md -d --ni # Notice the double-dash (--) on 'ni'
npx @p-buddy/parkdown -d --ni # defaults to processing the 'README.md' file of the current working directory
```

The following commands will lead to the same result, but since `--no-inclusions` (`--ni`) is not specified, there will be some wasted work as inclusions will be processed and then removed.

```bash
npx @p-buddy/parkdown --file ./README.md --depopulate
npx @p-buddy/parkdown -f README.md -d
npx @p-buddy/parkdown -d # defaults to processing the 'README.md' file of the current working directory
```

### `depopulateMarkdownIncludes` export

[](.assets/code/depopulate.ts?region=replace(pkg,'''@p-buddy_slash_parkdown''',_))
<!-- p↓ BEGIN -->
<!-- p↓ length lines: 10 chars: 176 -->

```ts
import { depopulateMarkdownInclusions } from "@p-buddy/parkdown";

const file = "README.md";
const writeFile = true;

depopulateMarkdownInclusions(file, writeFile);
```

<!-- p↓ END -->
<!-- p↓ END -->
