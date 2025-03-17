# parkdown

[](./.assets/inclusions.md)
<!-- parkdown BEGIN -->
## Inclusions

You can _include_ other files' content within your markdown files using a link with no text i.e. `[](<url>)`, where `<url>` corresponds to either:
  - a local file, e.g. `[](./other.md)` or `[](../root.md)`
  - **_COMING SOON_**: An external link 

Markdown renderers shouldn't display these links, but [parkdown]() can process and populate them (and also hopefully your editor makes them easy to navigate to).

### Invocation

Invoke [parkdown's]() _inclusion_ functionality in your markdown files with either the [cli](#cli-inclusions) or via the `processMarkdownIncludes` [export](#`processMarkdownIncludes`-export):

#### CLI (inclusions)

The following commands are all equivalent:
```bash
npx parkdown --file ./README.md
npx parkdown -f README.md
npx parkdown # defaults to processing inclusions in the 'README.md' file of the current working directory
```

#### `populateMarkdownIncludes` export

[](./code/inclusions.ts)
<!-- parkdown BEGIN -->
```ts
import { populateMarkdownInclusions } from "../../src";

const file = "README.md";
const writeFile = true;

populateMarkdownInclusions(file, writeFile);
```
<!-- parkdown END -->

### Authoring

As mentioned above, you can author inclusions in your markdown files using a link with no text i.e. `[](<url>)`, where `<url>` points to some local or remote text resource (e.g.`./other.md`, `https://example.com/remote.md`).

How you author these "empty" links affects how they end up being rendered, either [inline](#inline) or as a [block](#block).

#### Inline

Inline inclusions occur when your "empty" link has siblings (meaning it's **not** the only node in a [paragraph](https://www.markdownguide.org/basic-syntax/#paragraphs-1)).

There are two equivalent ways to author inline inclusions, and which you choose depends on how you want your raw markdown to look.

##### Option A (single line)

What you write:

[](./unpopulated/inline.single.md?tag=code)
<!-- parkdown BEGIN -->
```md
Before: [](<url>) :After
```
<!-- parkdown END -->

What is rendered (**_before_** processing, sama as [Option B](#option-b-multi-line)):

[](./unpopulated/inline.single.md?tag=quote)
<!-- parkdown BEGIN -->
<blockquote>

Before: [](<url>) :After

</blockquote>

<!-- parkdown END -->

What your markdown file contains (**_after_** processing):

[](./populated/inline.single.md?tag=code)
<!-- parkdown BEGIN -->
```md
Before: [](<url>) <!-- parkdown Begin -->
...Included Content...
...Included Content... <!-- parkdown End --> :After
```
<!-- parkdown END -->

What is rendered (**_after_** processing, same as [Option B](#option-b-multi-line)):

[](./populated/inline.single.md?tag=quote)
<!-- parkdown BEGIN -->
<blockquote>

Before: [](<url>) <!-- parkdown Begin -->
...Included Content...
...Included Content... <!-- parkdown End --> :After

</blockquote>

<!-- parkdown END -->

##### Option B (multi line)

What you write:

[](./unpopulated/inline.multi.md?tag=code)
<!-- parkdown BEGIN -->
```md
Before: 
[](<url>)
:After
```
<!-- parkdown END -->

What is rendered (**_before_** processing, same as [Option A](#option-a-single-line)):

[](./unpopulated/inline.multi.md?tag=quote)
<!-- parkdown BEGIN -->
<blockquote>

Before: 
[](<url>)
:After

</blockquote>

<!-- parkdown END -->

What your markdown file contains (**_after_** processing):

[](./populated/inline.multi.md?tag=code)
<!-- parkdown BEGIN -->
```md
Before: 
[](<url>) <!-- parkdown Begin (inline) -->
...Included Content...
...Included Content... <!-- parkdown End (inline) --> 
:After
```
<!-- parkdown END -->

What is rendered (**_after_** processing, same as [Option A](#option-a-single-line)):

[](./populated/inline.multi.md?tag=quote)
<!-- parkdown BEGIN -->
<blockquote>

Before: 
[](<url>) <!-- parkdown Begin (inline) -->
...Included Content...
...Included Content... <!-- parkdown End (inline) --> 
:After

</blockquote>

<!-- parkdown END -->

#### Block

Block inclusions occur when your "empty" link is the **only** node in a [paragraph](https://www.markdownguide.org/basic-syntax/#paragraphs-1) (at least before being populated). This is likely the most common way to author inclusions.

What you write:

[](./unpopulated/block.md?tag=code)
<!-- parkdown BEGIN -->
```md
Before:

[](<url>)

:After
```
<!-- parkdown END -->

What is rendered (**_before_** processing):

[](./unpopulated/block.md?tag=quote)
<!-- parkdown BEGIN -->
<blockquote>

Before:

[](<url>)

:After

</blockquote>

<!-- parkdown END -->

What your markdown file contains (**_after_** processing):

[](./populated/block.md?tag=code)
<!-- parkdown BEGIN -->
```md
Before:

[](<url>)
<!-- parkdown Begin  -->
...Included Content...
...Included Content...
<!-- parkdown End  -->

:After
```
<!-- parkdown END -->

What is rendered (**_after_** processing):

[](./populated/block.md?tag=quote)
<!-- parkdown BEGIN -->
<blockquote>

Before:

[](<url>)
<!-- parkdown Begin  -->
...Included Content...
...Included Content...
<!-- parkdown End  -->

:After

</blockquote>

<!-- parkdown END -->

#### Query parameters

You can pass query parameters to your inclusion links to control how they're processed.

##### `skip`
```md
[](...?skip)
```

[](../src/include.ts?tag=dropdown(See-default-behavior.)&boundary=Default-Behavior)
<!-- parkdown BEGIN -->

<details>
<summary>See default behavior.</summary>

```ts
if (extension === "md")
  content = recursivelyPopulateInclusions(content, headingDepth, getContent);
else if (/^(js|ts)x?|svelte$/i.test(extension))
  content = wrap("code", content);
```
</details>

<!-- parkdown END -->

##### `tag`
```md
[](...?tag=code)
```

##### `boundary`

```md
[](...?boundary=example)
```



### Removing populated inclusions

Sometimes you may want to remove populated inclusions from your markdown file, since they can make things more difficult to read during authoring. You can do this either using the [cli](#cli-removing-populated-inclusions) or via the `removePopulatedInclusions` [export](#`removePopulatedInclusions`-export):

#### CLI (removing populated inclusions)

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

#### `depopulateMarkdownIncludes` export

[](./code/depopulate.ts)
<!-- parkdown BEGIN -->
```ts
import { depopulateMarkdownInclusions } from "../../src";

const file = "README.md";
const writeFile = true;

depopulateMarkdownInclusions(file, writeFile);
```
<!-- parkdown END -->

<!-- parkdown END -->
