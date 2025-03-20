# Query parameters

You can pass query parameters to your inclusion links to control how their content is processed and included within your markdown.

## Processing Order

[](../src/include.ts?&region=extract(query))

## `region`

Either extract, remove, or replace content from the included file based on the provided specifier(s).

Specifiers will be searched for within the file's comments, and are expected to come in pairs / bookend the desired region, like so:

```ts
/** some-specifier */
... code to find ...
/** some-specifier */
```

Below is the currently supported API for the `region` query parameter, where each defined method signature can be _invoked_ as a value for the `region` parameter, for example:

- `[](<url>?region=extract(some-specifier))`
- `[](<url>?region=remove(some-specifier))`
- `[](<url>?region=replace(some-specifier,replacement-content))`

If no value(s) are included (e.g. `[](<url>?region)`), then simply all comments that contain `parkdown:` or `p↓:` will be stripped (as is done as a post-processing step for all other `region` functionality).

[](./api-note.md?wrap=quote)

[](../src/region.ts?region=extract(definition))

## `skip`

Skip the default processing behavior for the given type of file. 

[](../src/include.ts?wrap=dropdown(See-default-processing-behavior.)&region=extract(Default-Behavior),replace(...))

```md
[](<url>?skip)
```

## `heading` 

Modify the heading depth applied to included content. By default, the headings of the included content are adjusted to be one-level below their parent heading (i.e. the heading the included content falls under).

You might commonly see `[](<url>?heading=-1)` used to ensure that the included content's heading level is the same as it's parent heading.

<details>
<summary>
See example usage:
</summary>
Assuming you have the following markdown files:

```md
<!-- to-be-included.md -->
# Included Heading
```

```md
<!-- README.md -->
# Heading

[](./to-be-included.md)
```

When `README.md` is processed, it will be transformed into the following:

```md
# Heading

## Included Heading
```

Where the included content's heading has been modified to be one-level below the parent heading (i.e. it is converted from an `h1` / `#` heading to a `h2` / `##` heading — `h1 + 1 = h2`).

If we instead wanted the included heading to remain a `h1` / `#` heading, we'd make use of the `heading` query parameter with a value of `-1` (since `h1 + 1 - 1 = h1`), like so:

```md
<!-- README.md -->
# Heading

[](./to-be-included.md?heading=-1)
```

which would result in the following:

```md
# Heading

# Included Heading
```

</details>

## `inline` (Advanced)

Force a replacement target to be treated as [inline](#inline) content.

## `wrap`

Wrap the content of the included file in a specific kind of element.

Below is the currently supported API for the `wrap` query parameter, where each defined method signature can be _invoked_ as a value for the `wrap` parameter, for example:

- `[](<url>?wrap=code)`
- `[](<url>?wrap=dropdown(hello-world))`

[](./api-note.md?wrap=quote)

[](../src/wrap.ts?region=extract(definition))

[](./api.md?heading=-1)