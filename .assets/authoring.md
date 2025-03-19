# Authoring

You author inclusions in your markdown files using a link with no text i.e. `[](<url>)`, where `<url>` points to some local or remote text resource (e.g.`./other.md`, `https://example.com/remote.md`).

These links can be rendered either [inline](#inline) or [block](#block), depending on how you author them.

## Inline

Inline inclusions occur when your _text-less_ link has 1 or more siblings (meaning it's **not** the only node in a [paragraph](https://www.markdownguide.org/basic-syntax/#paragraphs-1)).

There are two equivalent ways to author inline inclusions, [single-line](#single-line) or [multi-line](#multi-line), and which you choose depends solely on how you want your raw markdown to look (it will **not** affect the rendered output).

### Single-line

What you write:

[](./unpopulated/inline.single.md?wrap=code)

<details>
<summary>See rendering and processing output</summary>

What is rendered (**_before_** processing, same as [Multi-line](#multi-line)):

[](./unpopulated/inline.single.md?wrap=quote&inline)

What your markdown file contains (**_after_** processing):

[](./populated/inline.single.md?wrap=code)

What is rendered (**_after_** processing, same as [Multi-line](#multi-line)):

[](./populated/inline.single.md?wrap=quote&inline)

</details>

### Multi-line

What you write:

[](./unpopulated/inline.multi.md?wrap=code)

<details>
<summary>See rendering and processing output</summary>

What is rendered (**_before_** processing, same as [Single-line](#single-line)):

[](./unpopulated/inline.multi.md?wrap=quote&inline)

What your markdown file contains (**_after_** processing):

[](./populated/inline.multi.md?wrap=code)

What is rendered (**_after_** processing, same as [Single-line](#single-line)):

[](./populated/inline.multi.md?wrap=quote&inline)

</details>

## Block

Block inclusions occur when your "empty" link is the **only** node in a [paragraph](https://www.markdownguide.org/basic-syntax/#paragraphs-1) (at least before being populated). This is likely the most common way to author inclusions.

What you write:

[](./unpopulated/block.md?wrap=code)

<details>
<summary>See rendering and processing output</summary>

What is rendered (**_before_** processing):

[](./unpopulated/block.md?wrap=quote)

What your markdown file contains (**_after_** processing):

[](./populated/block.md?wrap=code)

What is rendered (**_after_** processing):

[](./populated/block.md?wrap=quote)

</details>

[](./query.md?heading=-1)