# Inclusion

How you express your [parkdown]() blocks depends on how you want them to be rendered -- either [Inline](#inline) or as a [Block](#block).

## Inline

Inline inclusions occur when a "[special link]()" is

### Option A (single line)

#### Unpopulated

What you write:

[](./unpopulated/inline.single.md?code)

What is rendered:

> [](./unpopulated/inline.single.md)

#### Populated

What your markdown file contains:

[](./populated/inline.single.md?code)

What is rendered:

> [](./populated/inline.single.md)

### Option B (multi line)

#### Unpopulated

What you write:

[](./unpopulated/inline.multi.md?code)

What is rendered:

> [](./unpopulated/inline.multi.md)

#### Populated

What your markdown file contains:

[](./populated/inline.multi.md?code)

What is rendered:

> [](./populated/inline.multi.md)

## Block

### Unpopulated

What you write:

[](./unpopulated/block.md?code)

What is rendered:

<blockquote>

[](./unpopulated/block.md)

</blockquote>

### Populated

What your markdown file contains:

[](./populated/block.md?code)

What is rendered:

<blockquote>
[](./populated/block.md)
</blockquote>
