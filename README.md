# parkdown

[](./.assets/inclusions.md)
<!-- parkdown BEGIN -->
## Inclusion

You can _include_ other files' content within your markdown files using a link with no text i.e. `[](<url>)`, where `<url>` corresponds to either:
  - a local file, e.g. `[](./other.md)` or `[](../root.md)`
  - **_COMING SOON_**: An external link 

Markdown renderers shouldn't display these links, but [parkdown]() can process and populate them (and also hopefully your editor makes them easy to navigate to).

See how to author these links in more detail below, and then tell [parkdown]() to process your markdown file with either the [cli]() or via the `processMarkdownIncludes` export:

[](./processIncludes.example.ts)
<!-- parkdown BEGIN -->
```ts
import { processMarkdownIncludes } from "../src";

const file = "README.md";
const writeFile = true;

processMarkdownIncludes(file, writeFile);
```
<!-- parkdown END -->

### Authoring Inclusions

#### Inline

Inline inclusions occur when your e "[special link]()" is

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

##### Block

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
<!-- parkdown END -->