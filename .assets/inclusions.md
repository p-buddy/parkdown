# Inclusion

You can _include_ other files' content within your markdown files using a link with no text i.e. `[](<url>)`, where `<url>` corresponds to either:
  - a local file, e.g. `[](./other.md)` or `[](../root.md)`
  - **_COMING SOON_**: An external link 

Markdown renderers shouldn't display these links, but [parkdown]() can process and populate them (and also hopefully your editor makes them easy to navigate to).

## Invocation

Invoke [parkdown's]() _inclusion_ in your markdown files with either the [cli](#cli) or via the `processMarkdownIncludes` [export](#`processMarkdownIncludes`-export):

### CLI

The following commands are all equivalent:
```bash
npx parkdown --file ./README.md --includes
npx parkdown -f README.md -i
npx parkdown # defaults to processing inclusions in the 'README.md' file of the current working directory
```

### `processMarkdownIncludes` export

[](./processIncludes.example.ts)

## Authoring

As mentioned above, you can author inclusions in your markdown files using a link with no text i.e. `[](<url>)`, where `<url>` points to some local or remote text resource (e.g.`./other.md`, `https://example.com/remote.md`).

How you author these "empty" links affects how they end up being rendered, either [inline](#inline) or as a [block](#block).

### Inline

Inline inclusions occur when your "empty" link has siblings (meaning it's **not** the only node in a [paragraph](https://www.markdownguide.org/basic-syntax/#paragraphs-1)).

There are two equivalent ways to author inline inclusions, and which you choose depends on how you want your raw markdown to look.

#### Option A (single line)

What you write:

[](./unpopulated/inline.single.md?tag=code)

What is rendered (**_before_** processing, sama as [Option B](#option-b-multi-line)):

[](./unpopulated/inline.single.md?tag=quote)

What your markdown file contains (**_after_** processing):

[](./populated/inline.single.md?tag=code)

What is rendered (**_after_** processing, same as [Option B](#option-b-multi-line)):

[](./populated/inline.single.md?tag=quote)

#### Option B (multi line)

What you write:

[](./unpopulated/inline.multi.md?tag=code)

What is rendered (**_before_** processing, same as [Option A](#option-a-single-line)):

[](./unpopulated/inline.multi.md?tag=quote)

What your markdown file contains (**_after_** processing):

[](./populated/inline.multi.md?tag=code)

What is rendered (**_after_** processing, same as [Option A](#option-a-single-line)):

[](./populated/inline.multi.md?tag=quote)

### Block

Block inclusions occur when your "empty" link is the **only** node in a [paragraph](https://www.markdownguide.org/basic-syntax/#paragraphs-1) (at least before being populated). This is likely the most common way to author inclusions.

What you write:

[](./unpopulated/block.md?tag=code)

What is rendered (**_before_** processing):

[](./unpopulated/block.md?tag=quote)

What your markdown file contains (**_after_** processing):

[](./populated/block.md?tag=code)

What is rendered (**_after_** processing):

[](./populated/block.md?tag=quote)