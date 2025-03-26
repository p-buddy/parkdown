# `region`

Modify content from the included file based on regions designated by comments.

Comments that act as region boundaries will be identified by their specifiers, and are expected to come in pairs / bookend the desired region, like so:

```ts
/** some-specifier */
... code to find ...
/** some-specifier */
```

> **NOTE:** Because comments are expected to come in consecutive pairs, nesting regions that are retrieved with the _same_ specifier will *NOT* work as expected (since the nesting will not be respected).

Identifiers will be searched for within the text of a comment, split by spaces (i.e. `/* some-specifier */` has a single identifier, but `/* some specifier */` can be identified by either `some` or `specifier`).

It is generally **BEST PRACTICE** to include a _parkdown prefix_ in your comment text, as all parkdown-prefixed comments will be stripped as a post-processing step. Otherwise, non-prefixed comment boundaries will be left in the included content, regardless of how they are processed.  

The supported prefixes are:

[](../src/comments.ts?region=extract(prefixes))

Below is the currently supported API for the `region` query parameter, where each defined method signature can be _invoked_ as a value for the `region` parameter, for example:

- `[](<url>?region=method(argument))`

If no value(s) are included (e.g. `[](<url>?region)`), then simply all comments that contain `parkdown:` or `p↓:` will be stripped (as is done as a post-processing step for all other `region` functionality).

[](./api-note.md?wrap=quote)

[](../src/region.ts?region=extract(definition))