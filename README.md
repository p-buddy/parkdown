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

[](./unpopulated/inline.single.md?tag=code)
<!-- parkdown BEGIN -->
```md
Before: [](<url>) :After
```
<!-- parkdown END -->

What is rendered:

[](./unpopulated/inline.single.md?tag=quote)
<!-- parkdown BEGIN -->
<blockquote>

Before: [](<url>) :After

</blockquote>

<!-- parkdown END -->

##### Populated

What your markdown file contains:

[](./populated/inline.single.md?tag=code)
<!-- parkdown BEGIN -->
```md
Before: [](<url>) <!-- parkdown Begin -->
Included-1
Included-2 <!-- parkdown End --> :After
```
<!-- parkdown END -->

What is rendered:

[](./populated/inline.single.md?tag=quote)
<!-- parkdown BEGIN -->
<blockquote>

Before: [](<url>) <!-- parkdown Begin -->
Included-1
Included-2 <!-- parkdown End --> :After

</blockquote>

<!-- parkdown END -->

#### Option B (multi line)

##### Unpopulated

What you write:

[](./unpopulated/inline.multi.md?tag=code)
<!-- parkdown BEGIN -->
```md
Before: 
[](<url>)
:After
```
<!-- parkdown END -->

What is rendered:

[](./unpopulated/inline.multi.md?tag=quote)
<!-- parkdown BEGIN -->
<blockquote>

Before: 
[](<url>)
:After

</blockquote>

<!-- parkdown END -->

##### Populated

What your markdown file contains:

[](./populated/inline.multi.md?tag=code)
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

[](./populated/inline.multi.md?tag=quote)
<!-- parkdown BEGIN -->
<blockquote>

Before: 
[](<url>) <!-- parkdown Begin (inline) -->
Included-1
Included-2 <!-- parkdown End (inline) --> 
:After

</blockquote>

<!-- parkdown END -->

### Block

#### Unpopulated

What you write:

[](./unpopulated/block.md?tag=code)
<!-- parkdown BEGIN -->
```md
Before:

[](<url>)

:After
```
<!-- parkdown END -->

What is rendered:

[](./unpopulated/block.md?tag=quote)
<!-- parkdown BEGIN -->
<blockquote>

Before:

[](<url>)

:After

</blockquote>

<!-- parkdown END -->


#### Populated

What your markdown file contains:

[](./populated/block.md?tag=code)
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

[](./populated/block.md?tag=quote)
<!-- parkdown BEGIN -->
<blockquote>

Before:

[](<url>)
<!-- parkdown Begin  -->
Include-1
Include-2
<!-- parkdown End  -->

:After

</blockquote>

<!-- parkdown END -->
<!-- parkdown END -->