# Removing populated inclusions

Sometimes you may want to remove populated inclusions from your markdown file, since they can make things more difficult to read during authoring. You can do this either using the [cli](#cli-removing-populated-inclusions) or via the `removePopulatedInclusions` [export](#depopulateMarkdownIncludes-export):

## CLI (removing populated inclusions)

The following commands are all equivalent:

```bash
npx @p-buddy/parkdown --file ./README.md --depopulate --no-inclusions
npx @p-buddy/parkdown -f README.md -d --ni # Notice the double-dash (--) on 'ni'
npx @p-buddy/parkdown -d --ni # defaults to processing the 'README.md' file of the current working directory
```

The following commands will lead to the same result, but since `--no-inclusions` (`--ni`) is not specified, there will be some wasted work as inclusions will be processed and then removed.

```bash
npx @p-buddy/parkdown --file ./README.md --depopulate
npx @p-buddy/parkdown -f README.md -d
npx @p-buddy/parkdown -d # defaults to processing the 'README.md' file of the current working directory
```

## `depopulateMarkdownIncludes` export

[](./code/depopulate.ts?region=replace(pkg,'''@p-buddy_slash_parkdown''',_))