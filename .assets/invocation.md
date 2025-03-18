# Invocation

Invoke [parkdown's]() functionality with either the [cli](#cli-inclusions) or via the `processMarkdownIncludes` [export](#populateMarkdownIncludes-export):

## CLI

The following commands are all equivalent:
```bash
npx parkdown --file ./README.md
npx parkdown -f README.md
npx parkdown # defaults to processing inclusions in the 'README.md' file of the current working directory
```

## `populateMarkdownIncludes` export

[](./code/inclusions.ts?region=replace(pkg,'''parkdown'''))