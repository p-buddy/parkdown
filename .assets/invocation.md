# Invocation

Invoke [parkdown's]() _inclusion_ functionality in your markdown files with either the [cli](#cli-inclusions) or via the `processMarkdownIncludes` [export](#`processMarkdownIncludes`-export):

## CLI (inclusions)

The following commands are all equivalent:
```bash
npx parkdown --file ./README.md
npx parkdown -f README.md
npx parkdown # defaults to processing inclusions in the 'README.md' file of the current working directory
```

## `populateMarkdownIncludes` export

[](./code/inclusions.ts?region=replace(pkg,'''parkdown'''))