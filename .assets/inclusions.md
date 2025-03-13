# Inclusion

How you express your [parkdown]() blocks depends on how you want them to be rendered -- either [Inline](#inline) or as a [Block](#block).

## Inline

Inline inclusions occur when a "[special link]()" is

### Option A (single line)

What you write:

[](./unpopulated/inline.single.md?tag=code)

What is rendered (**_before_** processing):

[](./unpopulated/inline.single.md?tag=quote)

What your markdown file contains (**_after_** processing):

[](./populated/inline.single.md?tag=code)

What is rendered (**_after_** processing):

[](./populated/inline.single.md?tag=quote)

### Option B (multi line)

What you write:

[](./unpopulated/inline.multi.md?tag=code)

What is rendered (**_before_** processing):

[](./unpopulated/inline.multi.md?tag=quote)

What your markdown file contains (**_after_** processing):

[](./populated/inline.multi.md?tag=code)

What is rendered (**_after_** processing):

[](./populated/inline.multi.md?tag=quote)

## Block

What you write:

[](./unpopulated/block.md?tag=code)

What is rendered (**_before_** processing):

[](./unpopulated/block.md?tag=quote)

What your markdown file contains (**_after_** processing):

[](./populated/block.md?tag=code)

What is rendered (**_after_** processing):

[](./populated/block.md?tag=quote)