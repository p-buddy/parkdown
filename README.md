# parkdown (p↓)

`parkdown` allows you to include other file's content within your markdown using a link with no text (i.e. `[](<url>)`), where `<url>` corresponds to either:
  - a local file, e.g. `[](./other.md)` or `[](../root.ts)`
  - **_COMING SOON_**: An external link 
o navigate to, improving productivity.

Collectively, [parkdown]() enables your documentation to behave a little more like code, and for your code to have a rightful place in your documentation.

[](./.assets/invocation.md)
<!-- p↓ BEGIN -->
<!-- p↓ length lines: 29 chars: 743 -->
## Invocation

Invoke [parkdown's]() functionality with either the [cli](#cli-inclusions) or via the `processMarkdownIncludes` [export](#populateMarkdownIncludes-export):

### CLI

The following commands are all equivalent:
```bash
npx parkdown --file ./README.md
npx parkdown -f README.md
npx parkdown # defaults to processing inclusions in the 'README.md' file of the current working directory
```

### `populateMarkdownIncludes` export

[](.assets/code/inclusions.ts?region=replace(pkg,'''parkdown'''))
<!-- p↓ BEGIN -->
<!-- p↓ length lines: 10 chars: 163 -->

```ts
import { populateMarkdownInclusions } from "parkdown";

const file = "README.md";
const writeFile = true;

populateMarkdownInclusions(file, writeFile);
```

<!-- p↓ END -->
<!-- p↓ END -->

[](./.assets/authoring.md)
<!-- p↓ BEGIN -->
<!-- p↓ length lines: 413 chars: 11626 -->
## Authoring

You author inclusions in your markdown files using a link with no text i.e. `[](<url>)`, where `<url>` points to some local or remote text resource (e.g.`./other.md`, `https://example.com/remote.md`).

These links can be rendered either [inline](#inline) or [block](#block), depending on how you author them.

### Inline

Inline inclusions occur when your _text-less_ link has 1 or more siblings (meaning it's **not** the only node in a [paragraph](https://www.markdownguide.org/basic-syntax/#paragraphs-1)).

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

What is rendered (**_before_** processing, same as [Option B](#option-b-multi-line)):

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

What is rendered (**_after_** processing, same as [Option B](#option-b-multi-line)):

[](.assets/populated/inline.single.md?wrap=quote&inline)
<!-- p↓ BEGIN -->
<!-- p↓ length lines: 3 chars: 110 -->
> Before... [](<url>) <!-- p↓ Begin -->
...Included Content...
...Included Content... <!-- p↓ End --> ...After
<!-- p↓ END -->

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

What is rendered (**_before_** processing, same as [Option A](#option-a-single-line)):

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

What is rendered (**_after_** processing, same as [Option A](#option-a-single-line)):

[](.assets/populated/inline.multi.md?wrap=quote&inline)
<!-- p↓ BEGIN -->
<!-- p↓ length lines: 5 chars: 112 -->
> Before... 
[](<url>) <!-- p↓ Begin -->
...Included Content...
...Included Content... <!-- p↓ End --> 
...After
<!-- p↓ END -->

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

[](.assets/query.md?heading=-1)
<!-- p↓ BEGIN -->
<!-- p↓ length lines: 217 chars: 7332 -->
### Query parameters

You can pass query parameters to your inclusion links to control how their content is processed and included within your markdown.

#### Processing Order

[](src/include.ts?&region=extract(query))
<!-- p↓ BEGIN -->
<!-- p↓ length lines: 10 chars: 322 -->

```ts
const params = new URLSearchParams(query);
const regions = params.get("region")?.split(COMMA_NOT_IN_PARENTHESIS);
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

```md
[](...?region=extract(some-specifier))
```

Below is the currently supported API for the `region` query parameter, where each defined method signature can be _invoked_ as a value for the `region` parameter, for example:

- `[](<url>?region=extract(some-specifier))`
- `[](<url>?region=remove(some-specifier))`
- `[](<url>?region=replace(some-specifier,replacement-content))`

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
<!-- p↓ length lines: 36 chars: 1651 -->

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
]
```

<!-- p↓ END -->

#### `skip`

Skip the default processing behavior for the given type of file. 

[](src/include.ts?wrap=dropdown(See-default-processing-behavior.)&region=extract(Default-Behavior),replace(...))
<!-- p↓ BEGIN -->
<!-- p↓ length lines: 17 chars: 267 -->

<details>
<summary>
See default processing behavior.
</summary>

```ts
if (extension === "md") {
  ...
  content = recursivelyPopulateInclusions(content, ...);
}
else if (/^(js|ts)x?|svelte$/i.test(extension))
  content = wrap(content, "code", ...);
```

</details>

<!-- p↓ END -->

```md
[](<url>?skip)
```

#### `heading` 

Modify the heading depth applied to included content. By default, the headings of the included content are adjusted to be one-level below their parent heading.

In the following example, the headings within the included content of `<url>` will be adjusted to one-level below the parent heading (which is an `h2` / `##`), so any `#` headings will be converted to `###` headings, and `##` headings will be converted to `####` headings, and so on.

```md
## Heading

[](<url>)
```

The following would then ensure that the headings of the included content are at the same level as the parent heading.

```md
## Heading

[](<url>?heading=-1)
```

A value of `-2` would result in the headings of the included content being at their original level (since the content is being included underneath an `h2` / `##` heading).

#### `inline` (Advanced)

Force a replacement target to be treated as [inline](#inline) content.

#### `wrap`

Wrap the content of the included file in a specific kind of element.

Below is the currently supported API for the `wrap` query parameter, where each defined method signature can be _invoked_ as a value for the `wrap` parameter (e.g. `[](<url>?wrap=code)`, `[](<url>?wrap=dropdown(hello-world))`).

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

<!-- p↓ END -->
<!-- p↓ END -->

[](./.assets/depopulated.md)
<!-- p↓ BEGIN -->
<!-- p↓ length lines: 38 chars: 1393 -->
## Removing populated inclusions

Sometimes you may want to remove populated inclusions from your markdown file, since they can make things more difficult to read during authoring. You can do this either using the [cli](#cli-removing-populated-inclusions) or via the `removePopulatedInclusions` [export](#depopulateMarkdownIncludes-export):

### CLI (removing populated inclusions)

The following commands are all equivalent:

```bash
npx parkdown --file ./README.md --depopulate --no-inclusions
npx parkdown -f README.md -d --ni # Notice the double-dash (--) on 'ni'
npx parkdown -d --ni # defaults to processing the 'README.md' file of the current working directory
```

The following commands will lead to the same result, but since `--no-inclusions` (`--ni`) is not specified, there will be some wasted work as inclusions will be processed and then removed.

```bash
npx parkdown --file ./README.md --depopulate
npx parkdown -f README.md -d
npx parkdown -d # defaults to processing the 'README.md' file of the current working directory
```

### `depopulateMarkdownIncludes` export

[](.assets/code/depopulate.ts?region=replace(pkg,'''parkdown'''))
<!-- p↓ BEGIN -->
<!-- p↓ length lines: 10 chars: 167 -->

```ts
import { depopulateMarkdownInclusions } from "parkdown";

const file = "README.md";
const writeFile = true;

depopulateMarkdownInclusions(file, writeFile);
```

<!-- p↓ END -->
<!-- p↓ END -->