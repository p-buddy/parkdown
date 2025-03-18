# Query parameters

You can pass query parameters to your inclusion links to control how their content is processed and included within your markdown.

## Processing Order

[](../src/include.ts?&region=extract(query))

## `skip`

Skip the default processing behavior for the given type of file. 

[](../src/include.ts?wrap=dropdown(See-default-processing-behavior.)&region=extract(Default-Behavior),replace(...))

```md
[](<url>?skip)
```

## `wrap`

Wrap the content of the included file in a specific kind of element.

Below is the currently supported API for the `wrap` query parameter, where each defined method signature can be _invoked_ as a value for the `wrap` parameter (e.g. `[](<url>?wrap=code)`, `[](<url>?wrap=dropdown(hello-world))`).

[](./api-note.md?wrap=quote)

[](../src/wrap.ts?region=extract(definition))

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

Below is the currently supported API for the `region` query parameter, where each defined method signature can be _invoked_ as a value for the `region` parameter (e.g. `[](<url>?region=extract(some-specifier))`, `[](<url>?region=remove(some-specifier))`, `[](<url>?region=replace(some-specifier))`).

[](./api-note.md?wrap=quote)

[](../src/region.ts?region=extract(definition))
