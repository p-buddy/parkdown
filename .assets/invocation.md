# Invocation

Invoke [parkdown's]() functionality with either the [cli](#cli-inclusions) or via the `processMarkdownIncludes` [export](#populateMarkdownIncludes-export):

## CLI

The following commands are all equivalent:
```bash
npx @p-buddy/parkdown --file ./README.md
npx @p-buddy/parkdown -f README.md
npx @p-buddy/parkdown # defaults to processing inclusions in the 'README.md' file of the current working directory
```

## `populateMarkdownIncludes` export

[](./code/inclusions.ts?region=replace(pkg,'''@p-buddy/parkdown'''))