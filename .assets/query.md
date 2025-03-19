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

```md
[](...?region=extract(some-specifier))
```

Below is the currently supported API for the `region` query parameter, where each defined method signature can be _invoked_ as a value for the `region` parameter, for example:

- `[](<url>?region=extract(some-specifier))`
- `[](<url>?region=remove(some-specifier))`
- `[](<url>?region=replace(some-specifier,replacement-content))`

[](./api-note.md?wrap=quote)

[](../src/region.ts?region=extract(definition))

## `skip`

Skip the default processing behavior for the given type of file. 

[](../src/include.ts?wrap=dropdown(See-default-processing-behavior.)&region=extract(Default-Behavior),replace(...))

```md
[](<url>?skip)
```

## `heading` 

Modify the heading depth applied to included content. By default, the headings of the included content are adjusted to be one-level below their parent heading.

In the following example, the headings within the included content of `<url>` will be adjusted to one-level below the parent heading (which is an `h2` / `##`), so any `#` headings will be converted to `###` headings, and `##` headings will be converted to `####` headings, and so on.

```md
## Heading

[](<url>)
```

The following would then ensure that the headings of the included content are at the same level as the parent heading.

```md
## Heading

[](<url>?heading=-1)
```

A value of `-2` would result in the headings of the included content being at their original level (since the content is being included underneath an `h2` / `##` heading).

## `inline` (Advanced)

Force a replacement target to be treated as [inline](#inline) content.

## `wrap`

Wrap the content of the included file in a specific kind of element.

Below is the currently supported API for the `wrap` query parameter, where each defined method signature can be _invoked_ as a value for the `wrap` parameter (e.g. `[](<url>?wrap=code)`, `[](<url>?wrap=dropdown(hello-world))`).

[](./api-note.md?wrap=quote)

[](../src/wrap.ts?region=extract(definition))
