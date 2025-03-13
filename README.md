# parkdown

[](./.assets/inclusions.md)
<!-- parkdown BEGIN -->
## Inclusion

How you express your [parkdown]() blocks depends on how you want them to be rendered -- either [Inline](#inline) or as a [Block](#block).

### Inline

Inline inclusions occur when a "[special link]()" is

#### Option A (single line)

##### Unpopulated

What you write:

[](./unpopulated/inline.single.md?code)
<!-- parkdown BEGIN -->
```md
Before: [](<url>) :After
```
<!-- parkdown END -->

What is rendered:

> [](./unpopulated/inline.single.md)
<!-- parkdown BEGIN -->
Before: [](<url>) :After
<!-- parkdown END -->

##### Populated

What your markdown file contains:

[](./populated/inline.single.md?code)
<!-- parkdown BEGIN -->
```md
Before: [](<url>) <!-- parkdown Begin -->
Included-1
Included-2 <!-- parkdown End --> :After
```
<!-- parkdown END -->

What is rendered:

> [](./populated/inline.single.md)
<!-- parkdown BEGIN -->
Before: [](<url>) <!-- parkdown Begin -->
Included-1
Included-2 <!-- parkdown End --> :After
<!-- parkdown END -->

#### Option B (multi line)

##### Unpopulated

What you write:

[](./unpopulated/inline.multi.md?code)
<!-- parkdown BEGIN -->
```md
Before: 
[](<url>)
:After
```
<!-- parkdown END -->

What is rendered:

> [](./unpopulated/inline.multi.md)
<!-- parkdown BEGIN -->
Before: 
[](<url>)
:After
<!-- parkdown END -->

##### Populated

What your markdown file contains:

[](./populated/inline.multi.md?code)
<!-- parkdown BEGIN -->
```md
Before: 
[](<url>) <!-- parkdown Begin (inline) -->
Included-1
Included-2 <!-- parkdown End (inline) --> 
:After
```
<!-- parkdown END -->

What is rendered:

> [](./populated/inline.multi.md)
<!-- parkdown BEGIN -->
Before: 
[](<url>) <!-- parkdown Begin (inline) -->
Included-1
Included-2 <!-- parkdown End (inline) --> 
:After
<!-- parkdown END -->

### Block

#### Unpopulated

What you write:

[](./unpopulated/block.md?code)
<!-- parkdown BEGIN -->
```md
Before:

[](<url>)

:After
```
<!-- parkdown END -->

What is rendered:

<blockquote>

[](./unpopulated/block.md)
<!-- parkdown BEGIN -->
Before:

[](<url>)

:After
<!-- parkdown END -->

</blockquote>

#### Populated

What your markdown file contains:

[](./populated/block.md?code)
<!-- parkdown BEGIN -->
```md
Before:

[](<url>)
<!-- parkdown Begin  -->
Include-1
Include-2
<!-- parkdown End  -->

:After
```
<!-- parkdown END -->

What is rendered:

<blockquote>
[](./populated/block.md)
</blockquote>

<!-- parkdown END -->