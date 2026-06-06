import type { AxisId } from "../company-data/types";
import { AXIS_IDS } from "../company-data/types";

// ───────────────────────────────────────────────────────────────────────────
// Prose for the axis info pages and the philosophy / about page.
//
// Voice: plain, direct, and personal. The site is one person's project, so the
// text speaks as "ik" / "i" — this is what i decided, not an institutional "we".
// No magazine snappiness, no em dashes, no "not this, but that" constructions,
// no accent marks for emphasis. Claims about what's "good" are hedged as my own
// opinion, never stated as fact. Dutch is primary; english mirrors it. All copy
// is lowercase per the app convention.
//
// Bold or contestable claims carry a footnote marker `[^id]` in the text; the
// matching note is listed at the bottom of the page. Every info page also ends
// with a short standing disclaimer (see getInfoDisclaimer).
// ───────────────────────────────────────────────────────────────────────────

type Locale = "nl" | "en";

const normalizeLocale = (locale: string): Locale => (locale === "en" ? "en" : "nl");

export type Readability = "high" | "medium" | "low";

export interface Footnote {
  id: string;
  body: string;
}

export interface AxisContent {
  // the one-line "in plain words" lead, also reused on the philosophy page list
  plain: string;
  // what the axis means, in human terms
  meaning: string[];
  // what pushes a company up or down on this axis
  counts: string[];
  // how i read a website that says nothing about it
  silence: string[];
  // notes referenced from the prose above via `[^id]`
  footnotes?: Footnote[];
  readability: Readability;
}

// ───────── axis prose ─────────

const AXIS_CONTENT: Record<Locale, Record<AxisId, AxisContent>> = {
  nl: {
    substance: {
      plain:
        "maakt dit bedrijf de wereld echt een beetje beter, of in elk geval niet slechter?",
      meaning: [
        "inhoud gaat over de kern. maakt het werk van een bedrijf de wereld echt een beetje beter, of in elk geval niet slechter? als het bedrijf morgen zou verdwijnen, zou iemand het dan echt missen? of verschuift het vooral geld, verkoopt het dingen die niemand nodig heeft, of houdt het mensen aan een scherm gekluisterd?",
        "dit is iets anders dan of een bedrijf zich netjes gedraagt. je kunt iets zinloos of schadelijks ook op een keurige manier verkopen. inhoud gaat over het ding zelf, niet over de manier waarop.",
      ],
      counts: [
        "ik haal de mooie woorden weg en stel één vraag: helpt het werk echt iemand? ik ben hier streng[^mening]. de meeste bedrijven voegen, eerlijk bekeken, niet echt iets toe. ze verdienen geld en maken bestaande handel sneller of makkelijker, maar de wereld zou ze niet missen[^economie]. die horen rond of onder het midden.",
        "een bedrijf scoort alleen hoog als de wereld beter maken echt zijn kerntaak is: de reden dat het bestaat. denk aan natuur herstellen, schone energie, zorg voor zieke of kwetsbare mensen, eten, reparatie of woningen die mensen echt nodig hebben, of onderwijs dat er echt toe doet.",
        "onder het midden zit gewoon commercieel werk: algemene bureaus, of software die bestaat omdat het verkoopt. dat is niet verkeerd, maar het voegt weinig toe. helemaal onderaan staat werk dat schaadt: gokken, verslavende apps, aandacht wegkapen, mensen een behoefte aanpraten.",
        "dat een bedrijf in een 'goede' sector lijkt te zitten, met een woord als 'gezondheid' of 'onderwijs' in de tekst, telt op zichzelf niet mee. het gaat om wat er echt gedaan wordt.",
      ],
      silence: [
        "vaagheid telt hier tegen. als je na een paar minuten op de site nog steeds niet kunt zeggen wat het bedrijf eigenlijk doet, zegt dat al genoeg. er is weinig inhoud, of het wordt bewust onduidelijk gehouden.",
      ],
      footnotes: [
        {
          id: "mening",
          body: "dit is de meest gekleurde van de vijf assen. of iets 'echt nodig' is, blijft een keuze en geen meting. ik probeer die keuze overal hetzelfde toe te passen, maar het blijft mijn mening.",
        },
        {
          id: "economie",
          body: "ik snap dat de economie zo niet in elkaar zit. bijna elk bedrijf vult ergens een gat, dus in zekere zin draagt alles wel iets bij. maar daar gaat het me niet om. als jij ergens gaat werken, steek je je tijd en kunde in dat stukje van de economie, en dat is beperkt. de vraag is dus niet of een bedrijf 'iets toevoegt', maar welk deel van de wereld jij groter wilt maken.",
        },
      ],
      readability: "high",
    },
    ecology: {
      plain:
        "wat doet dit bedrijf met de natuur: het klimaat, het land, de grondstoffen?",
      meaning: [
        "ecologie gaat over de verhouding van een bedrijf tot de natuur: het klimaat, het land, de grondstoffen die het gebruikt. herstelt het werk iets, is het ongeveer neutraal, of richt het stilletjes schade aan terwijl er mooi over gepraat wordt?",
        "het gaat om wat een bedrijf echt doet, niet om de duurzaamheidspagina die het over zichzelf schreef.",
      ],
      counts: [
        "ik denk dat het soort bedrijf al bijna alles zegt. aan het type werk kun je vrijwel altijd een basis aflezen, ook als er niets over het milieu op de site staat. concrete beloftes en bewijs schuiven die basis daarna een stukje op.",
        "positief: hergebruik en reparatie, schone energie, werk dat de natuur herstelt. ongeveer neutraal: licht werk zoals software en kenniswerk, met een kleine voetafdruk, maar zonder iets te herstellen. negatief: fossiel, fast fashion, wegwerp, of zware logistiek als kern.",
        "let ook op het verschil tussen woorden en feiten. veel groene woorden met weinig concrete cijfers erachter vind ik eerder een minpuntje dan een pluspunt.",
      ],
      silence: [
        "niets zeggen over het milieu is hier geen 'geen signaal', want het soort bedrijf zegt al iets. 'wij geven om de planeet' zonder iets concreets weegt voor mij licht negatief. het is het verschil tussen wat een bedrijf zegt en wat je echt kunt zien.",
      ],
      readability: "medium",
    },
    power: {
      plain: "wie is hier de eigenaar, en wie heeft er iets te zeggen?",
      meaning: [
        "macht gaat over wie het bedrijf bezit en wie er iets te zeggen heeft. zijn dat een paar eigenaren en investeerders die er waarde uit trekken, of wordt het eerlijker gedeeld met de mensen die het werk doen?",
        "voor mij is dit misschien wel de belangrijkste vraag: wie heeft de controle, en wie heeft er baat bij? maar het is ook de vraag waar bedrijven het minst over zeggen.",
      ],
      counts: [
        "sterke plus-signalen, als ze er zijn: een coöperatie, eigenaarschap bij de werknemers, of een structuur waarbij het bedrijf niet zomaar te koop is en bij zijn doel blijft (steward-ownership, of een stichting die de aandelen beheert). ook openheid over wat mensen verdienen en echte zeggenschap voor het personeel tellen mee.",
        "de andere kant: veel nadruk op investeerders en op snel groot worden en verkopen, en mensen die beschreven worden als een grondstof.",
      ],
      silence: [
        "hier reken ik stilte niet aan. de meeste bedrijven zeggen niets over hun interne structuur, en dat ze niets zeggen betekent niet dat het mis is. standaard staat deze op 'onbekend'. ik geef alleen een oordeel als er echt iets te zien is. dat een bedrijf er niets over zegt, is op zichzelf ook een eerlijk antwoord.",
      ],
      readability: "low",
    },
    embeddedness: {
      plain:
        "hoort dit bedrijf echt bij een plek en een gemeenschap, of kan het overal staan?",
      meaning: [
        "verankering gaat over hoe verbonden een bedrijf is met de wereld om zich heen: een plek, een gemeenschap, vaste relaties op de lange termijn.",
        "dit is iets anders dan macht. macht gaat over hoe het er binnen aan toe gaat, verankering over de band naar buiten. een coöperatie kan alsnog overal en nergens zijn, en een familiebedrijf dat diep geworteld is, kan vanbinnen juist heel autoritair zijn.",
      ],
      counts: [
        "de vraag is: zouden mensen in een buurt of streek dit bedrijf herkennen, en zouden ze merken dat het iets toevoegt aan waar ze wonen? of is het een gezichtsloze machine die overal zou kunnen staan en aan iedereen verkoopt? ik ben hier ook streng. de meeste bedrijven, zeker digitale, it- en dienstverleners die aan iedereen overal verkopen, zijn niet echt geworteld, dus die zitten onder het midden.",
        "een kantoor in een stad hebben, of aan één land verkopen, is nog geen verankering. positief: een lokale zaak die verweven is met de buurt, werk dat met en voor een bepaalde gemeenschap gedaan wordt, lokale inkoop, langlopende banden. verankering hoeft niet klein te zijn: een organisatie kan ook wereldwijd geworteld zijn als ze echt onderdeel is van de vele plekken waar ze werkt.",
      ],
      silence: [
        "een bedrijf dat overal en nergens is, geef ik hier een lage score. dat is geen verwijt, gewoon een beschrijving. alleen echt nuttige wereldwijde organisaties laten me twijfelen. 'geen signaal' gebruik ik alleen als er werkelijk niets over plek of gemeenschap gezegd wordt.",
      ],
      readability: "medium",
    },
    posture: {
      plain:
        "wil dit bedrijf eindeloos groeien, of is het tevreden met de juiste maat?",
      meaning: [
        "houding gaat over de instelling van een bedrijf tegenover groei. wil het koste wat het kost groter worden, snel schalen, de markt veroveren? of is het tevreden met de juiste maat, goed werk leveren en lang meegaan?",
        "hoe een bedrijf over zichzelf praat, verraadt dit meestal vrijwel helemaal.",
      ],
      counts: [
        "een website is praat, en de houding wordt vaak gewoon hardop gezegd. op groei gericht: 'hypergrowth', 'disrupt', '10x', 'marktleider', 'domineren', en beelden van strijd en verovering. op genoeg gericht: 'de juiste maat', vakmanschap, zorg, 'gemaakt om te blijven', kwaliteit en relatie boven schaal, een rustige toon.",
        "dit staat los van wat een bedrijf maakt. een echt nuttig medisch bedrijf kan alsnog als een veroveringstocht gerund worden, en een zonne-energiebedrijf kan goed scoren op ecologie en toch hard op groei zitten.",
      ],
      silence: [
        "dit komt weinig voor, want de meeste bedrijven laten hun houding makkelijk zien. is de toon echt neutraal, dan zet ik hem in het midden in plaats van te gokken.",
      ],
      readability: "high",
    },
  },
  en: {
    substance: {
      plain:
        "does this company actually make the world a little better, or at least not worse?",
      meaning: [
        "substance is about the core of it. does a company's work genuinely make the world a little better, or at least not worse? if it disappeared tomorrow, would anyone really miss it? or is it mostly moving money around, selling things nobody needs, or keeping people glued to a screen?",
        "this is a different question from whether a company behaves nicely. you can sell something pointless or harmful in a very tidy way. substance is about the thing itself, not the manner.",
      ],
      counts: [
        "i strip away the nice words and ask one question: does the work genuinely help anyone? i'm strict here[^mening]. most companies, looked at honestly, don't really add anything. they earn money and make existing trade faster or easier, but the world wouldn't miss them[^economie]. those sit around or below the middle.",
        "a company scores high only when making the world better is genuinely its core task: the reason it exists. think of restoring nature, clean energy, care for sick or vulnerable people, food, repair or housing people genuinely need, or education that really matters.",
        "below the middle is ordinary commercial work: general agencies, or software that exists because it sells. that isn't wrong, but it adds little. right at the bottom is work that harms: gambling, addictive apps, harvesting attention, talking people into needs they don't have.",
        "a company merely sitting near a 'good' sector, with a word like 'health' or 'education' in the copy, counts for nothing on its own. what matters is what's actually done.",
      ],
      silence: [
        "vagueness counts against here. if after a few minutes on the site you still can't say what the company actually does, that already tells you enough. there's little substance, or it's being kept deliberately unclear.",
      ],
      footnotes: [
        {
          id: "mening",
          body: "this is the most coloured of the five axes. whether something is 'really needed' stays a choice, not a measurement. i try to apply that choice the same way everywhere, but it stays my opinion.",
        },
        {
          id: "economie",
          body: "i get that the economy doesn't really work this way. almost every company fills a gap somewhere, so in a sense everything adds something. but that's not what i'm after. when you take a job, you put your time and skills into that part of the economy, and that's limited. so the question isn't whether a company 'adds something', but which part of the world you want to make bigger.",
        },
      ],
      readability: "high",
    },
    ecology: {
      plain:
        "what does this company do to the living world: the climate, the land, the materials?",
      meaning: [
        "ecology is about a company's relationship with nature: the climate, the land, the materials it uses. does the work repair something, sit roughly neutral, or quietly cause damage while talking nicely about it?",
        "it's about what a company actually does, not the sustainability page it wrote about itself.",
      ],
      counts: [
        "i think the kind of company already tells you most of it. you can almost always read a baseline from the type of work, even when the site says nothing about the environment. specific promises and evidence then nudge that baseline up or down.",
        "positive: reuse and repair, clean energy, work that restores nature. roughly neutral: light work like software and knowledge work, with a small footprint, but without restoring anything. negative: fossil-adjacent, fast fashion, single-use, or heavy logistics as the core.",
        "watch the gap between words and facts, too. lots of green words with few concrete numbers behind them i count as more of a minus than a plus.",
      ],
      silence: [
        "saying nothing about the environment isn't 'no signal' here, because the kind of company already says something. 'we care about the planet' with nothing concrete weighs slightly negative for me. it's the difference between what a company says and what you can actually see.",
      ],
      readability: "medium",
    },
    power: {
      plain: "who owns this place, and who gets a say?",
      meaning: [
        "power is about who owns the company and who has a say. is it a few owners and investors pulling value out, or is it shared more fairly with the people doing the work?",
        "for me this may well be the most important question: who's in control, and who benefits? but it's also the one companies say the least about.",
      ],
      counts: [
        "strong positive signals, when they're there: a cooperative, employee ownership, or a structure where the company isn't simply for sale and stays tied to its purpose (steward-ownership, or a foundation that holds the shares). openness about pay and real say for staff count too.",
        "the other side: heavy emphasis on investors and on growing big and selling fast, and people described as a resource.",
      ],
      silence: [
        "i don't hold silence against a company here. most say nothing about their internal structure, and saying nothing doesn't mean something's wrong. the default is 'unknown'. i only judge when there's something real to see. a company saying nothing about it is an honest answer in itself.",
      ],
      readability: "low",
    },
    embeddedness: {
      plain:
        "is this company really part of a place and a community, or could it be anywhere?",
      meaning: [
        "embeddedness is about how connected a company is to the world around it: a place, a community, lasting relationships.",
        "this is different from power. power is about how things work on the inside, embeddedness about the ties facing outward. a cooperative can still be anywhere and nowhere, and a deeply rooted family business can be quite authoritarian on the inside.",
      ],
      counts: [
        "the question is: would people in a neighbourhood or region recognise this company, and would they feel it adds something to where they live? or is it a faceless operation that could stand anywhere and sells to anyone? i'm strict here too. most companies, especially digital, it and service firms that sell to anyone anywhere, aren't really rooted, so they sit below the middle.",
        "having an office in a city, or selling to one country, isn't embeddedness yet. positive: a local business woven into its surroundings, work done with and for a particular community, local sourcing, long-standing ties. being embedded doesn't have to mean being small: an organisation can be rooted worldwide if it's genuinely part of the many places it works in.",
      ],
      silence: [
        "a company that's anywhere and nowhere i give a low score here. that's not a reproach, just a description. only genuinely useful global organisations give me pause. i only use 'no signal' when nothing at all is said about place or community.",
      ],
      readability: "medium",
    },
    posture: {
      plain:
        "does this company want to grow forever, or is it content to be the right size?",
      meaning: [
        "posture is about a company's attitude toward growth. does it want to get bigger at any cost, scale fast, conquer the market? or is it content with the right size, doing good work and lasting a long time?",
        "how a company talks about itself usually gives this away almost completely.",
      ],
      counts: [
        "a website is talk, and posture is usually said out loud. growth-driven: 'hypergrowth', 'disrupt', '10x', 'market leader', 'dominate', and images of battle and conquest. enough-driven: 'the right size', craft, care, 'built to last', quality and relationship over scale, a calm tone.",
        "this is separate from what a company makes. a genuinely useful medical company can still be run like a conquest, and a solar company can score well on ecology and still be all about growth.",
      ],
      silence: [
        "this one's rare, because most companies show their posture easily. where the tone is genuinely neutral, i put it in the middle rather than guessing.",
      ],
      readability: "high",
    },
  },
};

// ───────── section headings + small labels reused across the axis pages ─────────

const AXIS_SECTIONS: Record<Locale, {
  meaning: string;
  counts: string;
  silence: string;
  readability: string;
  readabilityPhrase: Record<Readability, string>;
  otherAxes: string;
  philosophyLink: string;
  axisEyebrow: (n: number) => string;
}> = {
  nl: {
    meaning: "wat het betekent",
    counts: "wat telt mee",
    silence: "als de site er niets over zegt",
    readability: "afleesbaarheid",
    readabilityPhrase: {
      high: "meestal goed af te lezen",
      medium: "redelijk, met ruis",
      low: "vaak niet af te lezen",
    },
    otherAxes: "de andere assen",
    philosophyLink: "waarom deze site bestaat",
    axisEyebrow: (n) => `as ${n} van 5`,
  },
  en: {
    meaning: "what it means",
    counts: "what counts",
    silence: "when the site says nothing",
    readability: "readability",
    readabilityPhrase: {
      high: "usually easy to read",
      medium: "fairly readable, with noise",
      low: "often hard to read",
    },
    otherAxes: "the other axes",
    philosophyLink: "why this site exists",
    axisEyebrow: (n) => `axis ${n} of 5`,
  },
};

// ───────── philosophy / about page ─────────

export interface PhilosophySection {
  heading: string;
  body: string[];
}

export interface PhilosophyContent {
  eyebrow: string;
  heading: string;
  intro: string[];
  // explanatory sections, shown before the axes list
  sections: PhilosophySection[];
  // the axes list sits near the bottom
  axesLead: string;
  axesLeadBody: string;
  // sections shown after the axes list (e.g. a note about the site itself)
  tailSections: PhilosophySection[];
  // a short, plain note that this is an evolving experiment
  closing: string[];
}

const PHILOSOPHY: Record<Locale, PhilosophyContent> = {
  nl: {
    eyebrow: "de bedrijfskompas",
    heading: "waarom deze site bestaat",
    intro: [
      "ik heb deze site gemaakt omdat ik vacaturesites raar vind werken. je ziet een bedrijf meestal alleen omdat het toevallig net een vacature online heeft staan op het moment dat jij kijkt. dat voelt als gokken. en wat je dan leest is vooral wervingstaal: vacatureteksten en bedrijfssites die eigenlijk marketingpagina's zijn, waar vaak onduidelijk blijft wat een bedrijf nou echt doet.",
      "ik wilde het andersom. ik studeer over een tijdje af, en voor het zover is wil ik rustig leren welke bedrijven er eigenlijk zijn en welke daarvan de moeite waard zijn om voor te werken. dus begin ik bij het bedrijf zelf: wat het echt doet, zonder de marketing eromheen.",
    ],
    sections: [
      {
        heading: "liever eerst een overzicht",
        body: [
          "bedrijven bestaan meestal al lang en blijven ook nog wel even. het lijkt me daarom logischer om de tijd te nemen: eerst rustig in kaart brengen wat er is in de stad waar je wilt werken, en hoe goed die bedrijven passen bij wat jij belangrijk vindt. met zo'n overzicht maak je een veel betere keuze dan met de gok van 'wie zoekt er nu net iemand?'.",
          "vind je een bedrijf waar je echt graag zou werken, dan hoeft het niet meteen. je kunt een open sollicitatie sturen, of gewoon afwachten tot er een keer een vacature is. op deze site kun je bedrijven als favoriet opslaan, zodat je zo'n lijstje langzaam opbouwt.",
        ],
      },
      {
        heading: "gewoon wat ze doen, zonder marketing",
        body: [
          "bij elk bedrijf zet ik een korte, eerlijke beschrijving van wat het echt doet, in een paar zinnen, plus een tagline. geen landingspagina-taal, gewoon waar het bedrijf zich mee bezighoudt.",
        ],
      },
      {
        heading: "hoe ik bedrijven bekijk",
        body: [
          "om bedrijven te kunnen vergelijken zonder ze plat te slaan, bekijk ik elk bedrijf op vijf assen. die assen beschrijven wat voor soort bedrijf het is. niet in welk onderwerp het werkt, en niet of het op dit moment iemand zoekt.",
          "die assen zijn behoorlijk subjectief: het zijn de dingen waar ik zelf op let. vind jij heel andere dingen belangrijk? helemaal prima. ik heb deze site in de eerste plaats voor mezelf gemaakt, en daarnaast voor wie er verder iets aan heeft. het is geen universele waarheid, en dat probeert het ook niet te zijn.",
        ],
      },
      {
        heading: "waar je werkt, telt",
        body: [
          "als je ergens gaat werken, geef je daar je tijd en je kunde aan. dat is geen oneindige hoeveelheid. met dat werk versterk je een stukje van de economie, of je dat nu wilt of niet.",
          "het idee van deze site is dat je daar bewust in kunt kiezen. welk deel van de wereld wil jij groter maken?",
        ],
      },
      {
        heading: "alleen openbare informatie",
        body: [
          "ik beoordeel een bedrijf alleen op wat het zelf openbaar deelt, vooral de eigen website. dat houdt het eerlijk, en het houdt de grenzen zichtbaar. ik doe niet alsof ik meer weet dan wat er te vinden is.",
        ],
      },
      {
        heading: "ik zeg het als ik het niet weet",
        body: [
          "bij elke score staat hoe zeker ik ben: ruim onderbouwd, deels, of geen signaal. als een website ergens niets over zegt, is het bedrijf daar niet slecht in. ik weet het dan gewoon niet.",
          "op sommige assen lees ik stilte als een klein minpuntje, op andere helemaal niet. elke aspagina legt uit hoe.",
        ],
      },
    ],
    axesLead: "de vijf assen",
    axesLeadBody:
      "elk bedrijf zie je als een profiel over deze vijf assen. klik op een as om er meer over te lezen.",
    tailSections: [
      {
        heading: "over de site",
        body: [
          "deze site is een statische website. er zijn geen accounts, er wordt niets naar een server gestuurd, en er is geen tracking of analytics. je favorieten en instellingen blijven gewoon in je eigen browser.",
        ],
      },
    ],
    closing: ["dit is een experiment. het verandert en groeit nog."],
  },
  en: {
    eyebrow: "de bedrijfskompas",
    heading: "why this site exists",
    intro: [
      "i built this site because i find job sites work in a strange way. you usually run into a company only because it happens to have a vacancy online right when you look. that feels like gambling. and what you read then is mostly recruitment language: job ads and company sites that are really marketing pages, where it often stays unclear what a company actually does.",
      "i wanted it the other way around. i'm a master's student and i'll graduate before long, and before then i want to take my time learning which companies are actually out there and which of them are worth working for. so i start from the company itself: what it really does, without the marketing around it.",
    ],
    sections: [
      {
        heading: "an overview first",
        body: [
          "companies usually exist for a long time and tend to stick around. so it seems more logical to take your time: first get a calm picture of what's out there in the city where you want to work, and how well those companies fit what you care about. with an overview like that you make a much better choice than with the gamble of 'who happens to be hiring right now?'.",
          "if you find a company you'd really like to work at, it doesn't have to happen straight away. you can send an open application, or simply wait until a vacancy comes up. on this site you can save companies as favourites, so you build up a shortlist over time.",
        ],
      },
      {
        heading: "just what they do, no marketing",
        body: [
          "for each company i write a short, honest description of what it really does, in a few sentences, plus a tagline. no landing-page language, just what the company actually works on.",
        ],
      },
      {
        heading: "how i look at companies",
        body: [
          "to compare companies without flattening them, i look at each one on five axes. those axes describe what kind of company it is. not which topic it works in, and not whether it's hiring right now.",
          "those axes are fairly subjective: they're the things i pay attention to myself. care about quite different things? totally fine. i made this site for myself in the first place, and beyond that for anyone who finds it useful. it isn't a universal truth, and it doesn't pretend to be.",
        ],
      },
      {
        heading: "where you work matters",
        body: [
          "when you take a job, you give it your time and your skills. that isn't an endless supply. with that work you make some part of the economy bigger, whether you mean to or not.",
          "the idea behind this site is that you can choose this on purpose. which part of the world do you want to grow?",
        ],
      },
      {
        heading: "only public information",
        body: [
          "i judge a company only on what it shares publicly, mostly its own website. that keeps things honest, and it keeps the limits in plain view. i don't pretend to know more than what's out there.",
        ],
      },
      {
        heading: "i say so when i don't know",
        body: [
          "every score comes with how sure i am: well-evidenced, partly, or no signal. if a website says nothing about something, that doesn't make the company bad at it. i just don't know.",
          "on some axes i read silence as a small minus, on others not at all. each axis page explains how.",
        ],
      },
    ],
    axesLead: "the five axes",
    axesLeadBody:
      "each company is shown as a profile across these five axes. tap an axis to read more about it.",
    tailSections: [
      {
        heading: "about the site",
        body: [
          "this is a static website. there are no accounts, nothing is sent to a server, and there's no tracking or analytics. your favourites and settings simply stay in your own browser.",
        ],
      },
    ],
    closing: ["this is an experiment. it still changes and grows."],
  },
};

// ───────── standing disclaimer, shown at the bottom of every info page ─────────

const DISCLAIMER: Record<Locale, { text: string; linkText: string; email: string }> = {
  nl: {
    text: "dit is mijn eigen kijk, geen objectieve waarheid. ben je het er niet mee eens?",
    linkText: "neem gerust contact op",
    email: "kappenfloris@gmail.com",
  },
  en: {
    text: "this is my own take, not an objective truth. disagree?",
    linkText: "feel free to get in touch",
    email: "kappenfloris@gmail.com",
  },
};

// ───────── inline footnote parsing ─────────

export type ProseSegment = { type: "text"; value: string } | { type: "ref"; id: string };

// Splits a paragraph string on `[^id]` markers into renderable segments.
export function parseInlineFootnotes(text: string): ProseSegment[] {
  const segments: ProseSegment[] = [];
  const re = /\[\^([a-z0-9-]+)\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) segments.push({ type: "text", value: text.slice(last, m.index) });
    segments.push({ type: "ref", id: m[1] });
    last = m.index + m[0].length;
  }
  if (last < text.length) segments.push({ type: "text", value: text.slice(last) });
  return segments;
}

// Maps each footnote id to its display number (1-based, in declared order).
export function footnoteNumbers(footnotes?: Footnote[]): Record<string, number> {
  const map: Record<string, number> = {};
  footnotes?.forEach((f, i) => {
    map[f.id] = i + 1;
  });
  return map;
}

// ───────── accessors ─────────

export function getAxisContent(axis: AxisId, locale: string): AxisContent {
  return AXIS_CONTENT[normalizeLocale(locale)][axis];
}

export function getAxisSections(locale: string) {
  return AXIS_SECTIONS[normalizeLocale(locale)];
}

export function getAxisNumber(axis: AxisId): number {
  return AXIS_IDS.indexOf(axis) + 1;
}

export function getPhilosophyContent(locale: string): PhilosophyContent {
  return PHILOSOPHY[normalizeLocale(locale)];
}

export function getInfoDisclaimer(locale: string) {
  return DISCLAIMER[normalizeLocale(locale)];
}
