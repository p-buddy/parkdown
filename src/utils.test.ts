import { describe, expect, test } from "vitest";
import { parse, NodeMap, type AstRoot, type ReplacementTarget, isSpecialLink, nodeSort, getAllPositionNodes, applyHeadingDepth, extractRegion, replaceRegion, specialLinkText, formClosingComment } from "./utils";
import { visit, } from "unist-util-visit";

describe(nodeSort.name, () => {
  test("should sort nodes by line number", () => {
    const ast = parse.md("# Hello\n\n[Link](http://example.com)");
    let previousLine = 0;
    let previousColumn = 0;
    for (const node of getAllPositionNodes(ast).sort(nodeSort)) {
      const lineIncreased = node.position.start.line > previousLine;
      const lineStayedTheSame = node.position.start.line === previousLine;
      const columnIncreased = node.position.start.column > previousColumn;
      const columnStayedTheSame = node.position.start.column === previousColumn;
      expect(lineIncreased || (lineStayedTheSame && (columnIncreased || columnStayedTheSame))).toBe(true);
      previousLine = node.position.start.line;
      previousColumn = node.position.start.column;
    }
    previousLine += 1;
    previousColumn = 0;
    for (const node of getAllPositionNodes(ast).sort(nodeSort.reverse)) {
      const lineDecreased = node.position.start.line < previousLine;
      const lineStayedTheSame = node.position.start.line === previousLine;
      const columnDecreased = node.position.start.column < previousColumn;
      const columnStayedTheSame = node.position.start.column === previousColumn;
      expect(lineDecreased || (lineStayedTheSame && (columnDecreased || columnStayedTheSame))).toBe(true);
      previousLine = node.position.start.line;
      previousColumn = node.position.start.column;
    }
  });

})

describe(NodeMap.name, () => {
  test(NodeMap.prototype.tryGetDepthForNode.name, () => {
    for (const markdown of lorem.md) {
      const headings = markdown.split("\n")
        .map((content, index) => ({ content, line: index + 1 }))
        .filter(({ content }) => content.startsWith("#"))
        .map(heading => ({ ...heading, depth: heading.content.match(/^#+/)?.[0].length }));
      const ast = parse.md(markdown);
      const depthMap = new NodeMap(ast);
      let index = headings.length - 1;
      for (const node of getAllPositionNodes(ast).sort(nodeSort.reverse)) {
        if (node.position.start.line < headings[index].line) index--;
        const depth = depthMap.tryGetDepthForNode(node);
        expect(depth).toBe(headings[index].depth,);
      }
    }
  });

  describe(NodeMap.prototype.getReplacementTargets.name, () => {
    test('should return empty array for no special links or comments', () => {
      const emptyMarkdown = "# Just a heading\n\nNo special links or comments here.";
      const emptyAst = parse.md(emptyMarkdown);
      const emptyNodeMap = new NodeMap(emptyAst);
      expect(emptyNodeMap.getReplacementTargets()).toEqual([]);
    });

    test('should handle single unpopulated special link (no closing comment)', () => {
      const singleLinkMarkdown = "# Heading\n\n[](http://example.com)";
      const singleLinkAst = parse.md(singleLinkMarkdown);
      const singleLinkNodeMap = new NodeMap(singleLinkAst);
      const singleLinkTargets = singleLinkNodeMap.getReplacementTargets();
      expect(singleLinkTargets.length).toBe(1);
      expect(singleLinkTargets[0].url).toBe("http://example.com");
      expect(singleLinkTargets[0].headingDepth).toBe(1);
      expect(extractRegion(singleLinkMarkdown, singleLinkTargets[0])).toBe("[](http://example.com)");
    });

    test('should handle special link with closing comment', () => {
      const linkWithCommentMarkdown =
        "# Main heading\n\n" +
        "## Section\n\n" +
        "[](./file.md)\n\n" +
        "Some content\n\n" +
        "<!-- parkdown END test -->";
      const linkWithCommentAst = parse.md(linkWithCommentMarkdown);
      const linkWithCommentNodeMap = new NodeMap(linkWithCommentAst);
      const linkWithCommentTargets = linkWithCommentNodeMap.getReplacementTargets();
      expect(linkWithCommentTargets.length).toBe(1);
      expect(linkWithCommentTargets[0].url).toBe("./file.md");
      expect(linkWithCommentTargets[0].headingDepth).toBe(2);
      expect(
        extractRegion(linkWithCommentMarkdown, linkWithCommentTargets[0])
      ).toBe("[](./file.md)\n\nSome content\n\n<!-- parkdown END test -->");
    });

    test('should handle multiple links and comments', () => {
      const complexMarkdown =
        "# Main heading\n\n" +
        "## First section\n\n" +
        "[](./first.md)\n\n" +
        "Some content\n\n" +
        "<!-- parkdown END first -->\n\n" +
        "## Second section\n\n" +
        "[](./second.md)\n\n" +
        "More content\n\n" +
        "<!-- parkdown END second -->\n\n" +
        "## Third section\n\n" +
        "[](http://example.com)";
      const complexAst = parse.md(complexMarkdown);
      const complexNodeMap = new NodeMap(complexAst);
      const complexTargets = complexNodeMap.getReplacementTargets();
      expect(complexTargets.length).toBe(3);

      // First replacement target should be the populated link (with comment)
      expect(complexTargets[0].url).toBe("./first.md");
      expect(complexTargets[0].headingDepth).toBe(2);
      expect(
        extractRegion(complexMarkdown, complexTargets[0])
      ).toBe("[](./first.md)\n\nSome content\n\n<!-- parkdown END first -->");

      // Second replacement target should be the populated link (with comment)
      expect(complexTargets[1].url).toBe("./second.md");
      expect(complexTargets[1].headingDepth).toBe(2);
      expect(
        extractRegion(complexMarkdown, complexTargets[1])
      ).toBe("[](./second.md)\n\nMore content\n\n<!-- parkdown END second -->");

      // Third replacement target should be the unpopulated link (no comment)
      expect(complexTargets[2].url).toBe("http://example.com");
      expect(complexTargets[2].headingDepth).toBe(2);
      expect(
        extractRegion(complexMarkdown, complexTargets[2])
      ).toBe("[](http://example.com)");
    });
  });
});

describe(isSpecialLink.name, () => {
  const check = (md: string, expectation: boolean) =>
    visit(parse.md(md), "link", (node) => expect(isSpecialLink(node)).toBe(expectation));

  const cases = {
    "non-link": ["test", false],
    "link has text": ["[test](http://example.com)", false],
    "link has no text, but unsupported target": ["[](file.md)", false],
    "web link": ["[](http://example.com)", true],
    "relative file, same directory": ["[](./file.md)", true],
    "relative file, different directory": ["[](../file.md)", true],
  } as const;

  for (const [description, [md, expectation]] of Object.entries(cases))
    test(description, () => check(md, expectation));
});

describe('applyHeadingDepth', () => {
  test('should increase heading levels by the specified depth', () => {
    const markdown = "# Heading 1\n\n## Heading 2\n\n### Heading 3";
    const result = applyHeadingDepth(markdown, 1);
    expect(result).toBe("## Heading 1\n\n### Heading 2\n\n#### Heading 3");
  });

  test('should decrease heading levels by the specified depth', () => {
    const markdown = "### Heading 3\n\n## Heading 2\n\n# Heading 1";
    const result = applyHeadingDepth(markdown, -1);
    expect(result).toBe("## Heading 3\n\n# Heading 2\n\n# Heading 1");
  });

  test('should cap heading levels at 6', () => {
    const markdown = "#### Heading 4\n\n##### Heading 5\n\n###### Heading 6";
    const result = applyHeadingDepth(markdown, 2);
    expect(result).toBe("###### Heading 4\n\n###### Heading 5\n\n###### Heading 6");
  });

  test('should not modify non-heading content', () => {
    const markdown = "# Heading 1\n\nSome regular text\n\n## Heading 2\n\n- List item 1\n- List item 2";
    const result = applyHeadingDepth(markdown, 1);
    expect(result).toBe("## Heading 1\n\nSome regular text\n\n### Heading 2\n\n- List item 1\n- List item 2");
  });

  test('should handle headings with different formatting', () => {
    const markdown = "# *Italic Heading*\n\n## **Bold Heading**\n\n### `Code Heading`";
    const result = applyHeadingDepth(markdown, 1);
    expect(result).toBe("## *Italic Heading*\n\n### **Bold Heading**\n\n#### `Code Heading`");
  });

  test('should handle headings with special characters', () => {
    const markdown = "# Heading with & special < characters >";
    const result = applyHeadingDepth(markdown, 2);
    expect(result).toBe("### Heading with & special < characters >");
  });

  test('should accept an existing AST as input', () => {
    const markdown = "# Heading 1\n\n## Heading 2";
    const ast = parse.md(markdown);
    const result = applyHeadingDepth(markdown, 2, ast);
    expect(result).toBe("### Heading 1\n\n#### Heading 2");
  });
});

describe('replaceRegion', () => {
  test('should replace a single-line region', () => {
    const lines = [
      "# Heading",
      "[](http://example.com)",
      "Some other content"
    ];

    const content = "This is new content";
    const msg = "replaced";
    const url = "http://example.com";
    const result = replaceRegion(lines.join("\n"), {
      region: {
        start: { line: 2, column: 1 },
        end: { line: 3, column: lines[2].length }
      },
      url
    }, content, msg);

    expect(result).toBe([lines[0], specialLinkText({ url }), content, formClosingComment(msg)].join("\n"));
  });

});

const lorem = {
  md: [
    `# Vi nactusque pelle at floribus irata quamvis

## Moenibus voluptas ludit

Lorem markdownum cornua, iter quiete, officiumque arbor vocisque, [alti
lumina](http://fundae.io/illa.aspx) Agenore. Vendit ob meos, mihi monitis saxum
noster, est eandem ante, tuos sopitus scopulis volentem. Rege semper iaculo
protinus poenae curribus increpat Stygias scire: prohibent, et regis in.
Profanos mecum muneris, dum iudicis eurus non sua accepit auras utque staret.

## Filius virgo culpa reliquit

Illa moenia vepre clauso o **praemia** fluidoque primo est, modo tamen tumultu
adorat: rogumque ursa **in**. Solum consensistis illis, Ithacis cuncti ver vidit
carbasa fluctibus ratione eundem mihi. Vineta *unda*, nec victricia, nullaque,
inploravere *poteram quae erat* et videt summas regia ferunt se, se?

## Illa nuncupat ante proxima habenti prodit

Sua qui passis barbam *mira*: adfer pericula; aut. Tua purpuraque passim
attulerat lanas monitae Turnus patrium cuius fuerat stupet exercent sine.
Incaluitque premebat ad elisa ut meruisse dum *solutis*, damnare. Texit Libycas,
est nunc Phoebus. Dominaeque meriti caligine vestigia *extentam* citra tecto
undas impetus alma, quam radix.

1. Umbras laudare per telo lacrimis
2. Saturno Andraemon Iovem
3. Cum eadem
4. Vacent Britannos neque quae rupit socialia pulcherrime
5. Vidit morsu

## Aut visam

Micantes *flecti*. Capitolia et aut haec *Latoius manet submersum* et non tumens
paternis. Ope cornua calidumque artes. Quoque forma, quae gemitus sanguine per
cunctos hanc est haec abstulit acumine morte hoc fui.

> Trepidare cum expellere pectus Ismenus tempora fulminis pater; coniunctaque
> vocabis placandam et ebori separat. Regna inpensius pater accipienda epytus
> *Phryges cum angustis* vehit; nec summo excutit Aulidaque partibus texitur
> perque indomitas frater. Sua ferens discedet et quae, sonantia, comminus
> *ego*, auras. Dives **ille dubitate eum** poterit adest marito bracchia nec
> tune, discordemque tanti credas caede hactenus, dumque. At et agros Laiades,
> illa virtute adorat, est mox palmiferos robore flere ubera.

Color genuumque natis Pactolides plangore concipiunt proxima est, aliquid,
iraque ad natus quoque? **Quoque et** et classe fidemque incepta qui cumque
latitans ac [vestrum](http://fallitquevolucris.org/fuerant-eris).`,
    `# Ipse oculis praecipitata nostro

## Victis ferroque umbram mors plenis

Lorem markdownum, angues nec pecudis ponat dabitur qua resedit. Genitor tellus
et loqui hac: et nullae regnaque, est. Durescit videri. Nunc navita cruento,
cum, puerilibus aequor. Pro saepe [iamque](http://saturnoquod.com/nullum),
statione noverat, simul teneri hoc idem opem: Peleus.

## Pro nisi vaticinos posse

Clymenen nec caesa reddi. Vocat cum, spectare in tamen te fugacibus, haut. Solus
extulit insistere pugnas praestatque modo purpureis venenata [tumet
sed](http://www.mihi-duc.com/ferro) curru sanguine levatus magnanimo. Dulichium
indulsit.

## Humano Gorgoneum portus nil pavens laboriferi rapui

Faciles non, Iris vero [medeatur reclusis](http://www.tendere.io/somnus) digna
et sumptis est feres viae hic huc barbae salus laetos. Et ante! Quid lumen Isi:
nec Rhenum, profecturas priorum aegide medias in coniugis cinctaque ad ignis
posito. Nubila in alternaque Procnes terrae adferre sentit postquam cui rerum
nubilus fulvas iam illis cum virgultis, unda [ipse
tamen](http://www.terra.org/nam.html).

    var port = uncForumRt(ccd * dpi_udp(1, 1, 52557),
            pppoe_scraping_switch.passive(adf_domain, floating +
            standaloneDnsPppoe, trashFileLed / safe_error_recursive), 2);
    if (-2) {
        bpsPOn = hardwareIso(1);
        vaporware_biometrics.wddm_spool_compile += multimediaStation(
                drop_property_boot, sms, crop_excel(2, snmp_truncate_inkjet));
    }
    softMetadata.installer = 4;
    var hdtv = printer_json_southbridge;

## Multorum pellant famularia praeterea humo

Carmine demisi super nantis **telo**! Dicimus requievit, lurida extenuant
**diverso paventis venter** ore medio deposuitque ex fons: Iuno latratibus.
Mediaque tum *Eurus*, unam nympha casu ille licet sinu est modo, celasse tamen.

## Quem puto suis semper expers hominis Placatus

**Sidera arma**; Iuventae loca victis: necis acies ducunt ipse non **precesque
petit demptos** effetus: oculis mittunt. In nam vox regia sustinet nervosque
obsceno Delphi haec genetrix Nereus [versasque
quaeratur](http://te-urbem.net/aqua). Terga deae natalis *Aetnen* ingemuit, cum
arserunt vertice **egimus** fama visa illic ipsamque.

1. Post petit unum accepisse obsequio populator praesagia
2. Terrena iam mora libera
3. Suas astra inflata litore crimine

Quibus viribus referam **est posse** Iphis extulerat oscula, clivum, tantum
patres formam villis [hic pruinas
remisit](http://quaeebur.com/condi-summas.aspx). In qui cum, **lac fugavi
Perseus**. Me iusta habitabat stabat tam locum similes pulsant; manu palantesque
deae cohaesit, nec ut opiferque fugientem eurus. Eodem vivit Aiaci minas non,
radices in petent audacia volabat pro dedit ducibusque et vertice abstinuit.`
  ] as const
}