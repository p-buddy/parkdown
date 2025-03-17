import { describe, expect, test } from "vitest";
import { parse, nodeSort, getAllPositionNodes, extractContent, replaceWithContent, getContentInBetween, } from "./utils";

describe(nodeSort.name, () => {
  test("should sort nodes by line number", () => {
    const ast = parse.md(lorem.md[0]);
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

const getLinkAndCommentAst = (markdown: string) => {
  const ast = parse.md(markdown);
  const links = getAllPositionNodes(ast, "link");
  expect(links.length).toBe(1);
  const comments = getAllPositionNodes(ast, "html");
  expect(comments.length).toBe(1);
  return { link: links[0], comment: comments[0], ast, markdown };
}

describe(extractContent.name, () => {
  test("should extract content from nodes", () => {
    const { link, comment, ast, markdown } = getLinkAndCommentAst(`
# Title

[link](http://example.com)
hello
<!-- comment -->`
    );

    let content = extractContent(markdown, link);
    expect(content).toBe("[link](http://example.com)");

    content = extractContent(markdown, comment);
    expect(content).toBe("<!-- comment -->");

    content = extractContent(markdown, link, comment);
    expect(content).toBe("[link](http://example.com)\nhello\n<!-- comment -->");
    expect(content).toBe(extractContent(markdown, comment, link));
  })
})

describe(replaceWithContent.name, () => {
  test("should replace content with new content", () => {
    const { link, comment, ast, markdown } = getLinkAndCommentAst(`
# Title

[link](http://example.com)
hello
<!-- comment -->

ahoy!`
    );
    const content = replaceWithContent(markdown, "new content", link, comment);
    expect(content).toBe("\n# Title\n\nnew content\n\nahoy!");
  })
});

describe(getContentInBetween.name, () => {
  test("should get content in between two multiline nodes", () => {
    const { link, comment, ast, markdown } = getLinkAndCommentAst(`
# Title

[link](http://example.com)
hello
<!-- comment -->`
    );
    const content = getContentInBetween(markdown, link, comment);
    expect(content).toBe("\nhello\n");
  });

  test("should get content in between two singleline nodes", () => {
    const { link, comment, ast, markdown } = getLinkAndCommentAst(`
# Title

[link](http://example.com) hello <!-- comment -->`
    );
    const content = getContentInBetween(markdown, link, comment);
    expect(content).toBe(" hello ");
  })
});

interface PsuedoDir {
  [key: string]: PsuedoDir | string;
}

export class PsuedoFilesystem {
  constructor(readonly root: PsuedoDir, options?: { setContentToPath?: boolean }) {
    const { setContentToPath = false } = options ?? {};
    if (setContentToPath) PsuedoFilesystem.SetAllFileContentToPath(this.root);
  }

  getFileFromAbsolutePath(path: string) {
    return path.split("/").reduce((acc, part) => (acc as Record<string, PsuedoDir>)[part], this.root) as any as string;
  }

  static SetAllFileContentToPath(root: PsuedoDir, prefix?: string) {
    for (const key in root) {
      const value = root[key];
      const path = prefix ? `${prefix}/${key}` : key;
      if (typeof value === "string") root[key] = path;
      else this.SetAllFileContentToPath(value, path);
    }
  }
}

export const lorem = {
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