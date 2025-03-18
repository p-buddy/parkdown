# Authoring

You can author inclusions in your markdown files using a link with no text i.e. `[](<url>)`, where `<url>` points to some local or remote text resource (e.g.`./other.md`, `https://example.com/remote.md`).

How you author these "empty" links affects how they end up being rendered, either [inline](#inline) or as a [block](#block).

## Inline

Inline inclusions occur when your "empty" link has siblings (meaning it's **not** the only node in a [paragraph](https://www.markdownguide.org/basic-syntax/#paragraphs-1)).

There are two equivalent ways to author inline inclusions, and which you choose depends on how you want your raw markdown to look.

### Option A (single line)

What you write:

[](./unpopulated/inline.single.md?wrap=code)

What is rendered (**_before_** processing, same as [Option B](#option-b-multi-line)):

[](./unpopulated/inline.single.md?wrap=quote&inline)

What your markdown file contains (**_after_** processing):

[](./populated/inline.single.md?wrap=code)

What is rendered (**_after_** processing, same as [Option B](#option-b-multi-line)):

[](./populated/inline.single.md?wrap=quote&inline)

### Option B (multi line)

What you write:

[](./unpopulated/inline.multi.md?wrap=code)

What is rendered (**_before_** processing, same as [Option A](#option-a-single-line)):

[](./unpopulated/inline.multi.md?wrap=quote&inline)

What your markdown file contains (**_after_** processing):

[](./populated/inline.multi.md?wrap=code)

What is rendered (**_after_** processing, same as [Option A](#option-a-single-line)):

[](./populated/inline.multi.md?wrap=quote&inline)

## Block

Block inclusions occur when your "empty" link is the **only** node in a [paragraph](https://www.markdownguide.org/basic-syntax/#paragraphs-1) (at least before being populated). This is likely the most common way to author inclusions.

What you write:

[](./unpopulated/block.md?wrap=code)

What is rendered (**_before_** processing):

[](./unpopulated/block.md?wrap=quote)

What your markdown file contains (**_after_** processing):

[](./populated/block.md?wrap=code)

What is rendered (**_after_** processing):

[](./populated/block.md?wrap=quote)

[](./query.md?heading=-1)