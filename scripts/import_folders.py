"""One-off bulk import (Day 11). Creates one specimen per photo folder and renames the folder to '{id:03d}-{old name}'.

Usage: python import_folders.py [--go]   (without --go it only checks and prints the plan)
Everything is a first guess from the folder name: components are TENTATIVE, the owner refines in the app.
T below is my reading of the 218 distinct folder names. The script refuses to run once any folder is numbered,
so it can't import anything twice; it's kept as a record of how the collection was seeded.
Env: PHOTOS_DIR (the folder of stone folders), API_URL.
"""
import csv, json, os, re, sys, urllib.request

ROOT = os.environ.get('PHOTOS_DIR', r'E:\vscode_dev\rock-collection-photos')
API = os.environ.get('API_URL', 'http://localhost:8080/api')
GO = '--go' in sys.argv

# Nature shorthands
N = {'NM': 'NATURAL_MINERAL', 'NR': 'NATURAL_ROCK', 'NO': 'NATURAL_ORGANIC', 'NML': 'NATURAL_MINERALOID',
     'TM': 'TREATED_MINERAL', 'S': 'SYNTHETIC', 'A': 'ARTIFICIAL', '': None}

# base folder name -> (name, nature, components "Material[:ROLE]; ...", country, locality, extras)
T = {}
def t(base, name, nature='', comps='', country=None, locality=None, **extra):
    T[base] = (name, N[nature], comps, country, locality, extra)

A = 'Agate'; CH = 'Chalcedony'
t('agate', 'Agate', 'NM', A)
t('agate-carnellian', 'Carnelian agate', 'NM', A)
t('agate-crazylace', 'Crazy lace agate', 'NM', A)
t('agate-dendritic', 'Dendritic agate', 'NM', A)
t('agate-eye', 'Eye agate', 'NM', A)
t('agate-fortification-maroko', 'Fortification agate', 'NM', A, 'Morocco')
t('agate-geode', 'Agate geode', 'NM', A)
t('agate-jasper-breccia', 'Agate and jasper breccia', 'NR', 'Agate; Chalcedony:ASSOCIATED')
t('agate-marcasite', 'Agate with marcasite', 'NM', 'Agate; Marcasite:ASSOCIATED')
t('agate-moss', 'Moss agate', 'NM', 'Agate; Chlorite:INCLUSION')
t('moss-agate', 'Moss agate', 'NM', 'Agate; Chlorite:INCLUSION')
t('agate-moss-stabilised', 'Moss agate, stabilised', 'TM', 'Agate; Chlorite:INCLUSION', treatmentNotes='Stabilised')
t('agate-moss-stick', 'Moss agate stick', 'NM', 'Agate; Chlorite:INCLUSION')
t('agate-nodule', 'Agate nodule', 'NM', A)
t('agate-orbicular-band', 'Orbicular banded agate', 'NM', A)
t('agate-orbicular-fortification', 'Orbicular fortification agate', 'NM', A)
t('agate-palm-root', 'Palm root agate', 'NM', A)
t('agate-plume', 'Plume agate', 'NM', A)
t('agate-poland', 'Polish agate', 'NM', A, 'Poland')
t('agate-scenic', 'Scenic agate', 'NM', A)
t('agate-seam', 'Seam agate', 'NM', A)
t('agate-seam-moss', 'Seam moss agate', 'NM', 'Agate; Chlorite:INCLUSION')
t('agate-spherulic', 'Spherulitic agate', 'NM', A)
t('agate-spherulic-stick', 'Spherulitic agate stick', 'NM', A)
t('agate-spotted', 'Spotted agate', 'NM', A)
t('agate-stick', 'Stick agate', 'NM', A)
t('agate-thunderegg', 'Thunderegg', 'NR', A)
t('agate-turkish-stick', 'Turkish stick agate', 'NM', A, 'Turkey')
t('agate-turritella', 'Turritella agate', 'NR', CH, tags=['fossil'])
t('grape-agate', 'Grape agate', 'NM', CH)
t('amazonite', 'Amazonite', 'NM', 'Amazonite')
t('amber', 'Amber', 'NO', 'Amber')
t('amethyst', 'Amethyst', 'NM', 'Amethyst')
t('amethyst-chevron', 'Chevron amethyst', 'NM', 'Amethyst; Quartz:ASSOCIATED')
t('amethyst-druzy', 'Druzy amethyst', 'NM', 'Amethyst')
t('amethyst-geode-breccia', 'Amethyst geode breccia', 'NR', 'Amethyst')
t('amethyst-on-matrix', 'Amethyst on matrix', 'NM', 'Amethyst')
t('ammonite', 'Ammonite', '', '', tags=['fossil'])
t('andalusite-chiastolite', 'Chiastolite', 'NM', 'Andalusite')
t('aquamarine', 'Aquamarine', 'NM', 'Beryl')
t('aragonite-azurite-afghanistan', 'Aragonite with azurite', 'NM', 'Aragonite; Azurite:ASSOCIATED', 'Afghanistan')
t('aragonite-morocco', 'Aragonite', 'NM', 'Aragonite', 'Morocco')
t('aragonite-spain', 'Aragonite', 'NM', 'Aragonite', 'Spain')
t('astrophyllite', 'Astrophyllite', 'NM', 'Astrophyllite')
t('astrophyllite-druzy', 'Druzy astrophyllite', 'NM', 'Astrophyllite')
t('aventurine', 'Aventurine', 'NR', 'Quartz; Fuchsite:INCLUSION')
t('azurite-maroko', 'Azurite', 'NM', 'Azurite', 'Morocco')
t('azurmalachite', 'Azurmalachite', 'NM', 'Azurite; Malachite:ASSOCIATED')
t('bismuth', 'Bismuth', 'S', 'Bismuth')
t('bulls-eye', 'Bull’s eye')
t('bulls-eye-quartz', 'Bull’s eye quartz', 'NM', 'Quartz')
t('calcite-quartz-bulgaria', 'Calcite with quartz', 'NM', 'Calcite; Quartz:ASSOCIATED', 'Bulgaria')
t('calcite-quartz-chlorite-bulgaria', 'Calcite with quartz and chlorite', 'NM',
  'Calcite; Quartz:ASSOCIATED; Chlorite:ASSOCIATED', 'Bulgaria')
t('carborundum-manmade', 'Carborundum', 'S', 'Silicon carbide')
t('celestite-madagaskar', 'Celestite', 'NM', 'Celestine', 'Madagascar')
t('chalcedony', 'Chalcedony', 'NM', CH)
t('chalcedony-apophyllite', 'Chalcedony with apophyllite', 'NM', 'Chalcedony; Apophyllite:ASSOCIATED')
t('chalcedony-crystalline-vug', 'Chalcedony with a crystal vug', 'NM', 'Chalcedony; Quartz:ASSOCIATED')
t('chalcedony-dendritic', 'Dendritic chalcedony', 'NM', CH)
t('chalcedony-fireagate-arizona', 'Fire agate', 'NM', 'Chalcedony; Goethite:INCLUSION', 'USA', 'Arizona',
  marketName='Fire agate')
t('chalcedony-honey', 'Honey chalcedony', 'NM', CH)
t('chalcedony-inclusions', 'Chalcedony with inclusions', 'NM', CH)
t('chalcedony-rhodochrosite-bulgaria', 'Chalcedony with rhodochrosite', 'NM',
  'Chalcedony; Rhodochrosite:ASSOCIATED', 'Bulgaria')
t('charoite', 'Charoite', 'NR', 'Charoite')
t('charoite-eudialyte', 'Charoite with eudialyte', 'NR', 'Charoite; Eudialyte:ASSOCIATED')
t('chrysocolla', 'Chrysocolla', 'NM', 'Chrysocolla')
t('chrysocolla-native-copper', 'Chrysocolla with native copper', 'NM', 'Chrysocolla; Copper:INCLUSION')
t('chrysoprase', 'Chrysoprase', 'NM', CH)
t('chrysoprase-variscite', 'Chrysoprase with variscite', 'NM', 'Chalcedony; Variscite:ASSOCIATED')
t('citrine', 'Citrine', 'NM', 'Citrine')
t('dioptase-kongo', 'Dioptase', 'NM', 'Dioptase', 'DR Congo')
t('dolomite-wave', 'Wave dolomite', 'NM', 'Dolomite')
t('dolomite-whitebuffalo', 'White buffalo stone', '', 'Dolomite')
t('dumortierite', 'Dumortierite', '', 'Dumortierite')
t('fake-scheelite', 'Fake scheelite', '', '', marketName='Scheelite')
t('fibrous-quartz-breccia', 'Fibrous quartz breccia', 'NR', 'Quartz')
t('fluorite', 'Fluorite', 'NM', 'Fluorite')
t('fluorite-green', 'Green fluorite', 'NM', 'Fluorite')
t('fluorite-rainbow', 'Rainbow fluorite', 'NM', 'Fluorite')
t('fuchsite-kyanite', 'Fuchsite with kyanite', 'NR', 'Fuchsite; Kyanite:INCLUSION')
t('glass-opaline', 'Opaline glass', 'A', 'Glass')
t('goldstone-blue', 'Blue goldstone', 'A', 'Glass')
t('goldstone-red', 'Goldstone', 'A', 'Glass; Copper:INCLUSION')
t('granite-poland-karwia', 'Granite', 'NR', 'Feldspar; Quartz:ASSOCIATED; Mica:ASSOCIATED', 'Poland', 'Karwia')
t('gypsum', 'Gypsum', 'NM', 'Gypsum')
t('halite-poland-wieliczka', 'Halite', 'NM', 'Halite', 'Poland', 'Wieliczka')
t('hawks-eye', 'Hawk’s eye', 'NM', 'Tiger\'s eye')
t('heliotrope-bloodstone', 'Bloodstone (heliotrope)', 'NM', 'Chalcedony; Hematite:INCLUSION')
t('hypersthene', 'Hypersthene', 'NM', 'Enstatite')
t('kammererite', 'Kämmererite', 'NM', 'Clinochlore')
t('labradorite', 'Labradorite', 'NM', 'Labradorite')
t('labradorite-cut', 'Labradorite, cut', 'NM', 'Labradorite')
t('lapis-lazuli', 'Lapis lazuli', 'NR', 'Lazurite; Calcite:ASSOCIATED; Pyrite:INCLUSION')
t('larimar-with-matrix', 'Larimar on matrix', 'NM', 'Pectolite')
t('larvikite', 'Larvikite', 'NR', 'Feldspar')
t('lepidolite-tourmaline-unicorn', 'Unicorn stone', 'NR', 'Lepidolite; Tourmaline:INCLUSION')
t('limestone-fossiliferous-poland-baltic', 'Fossiliferous limestone', 'NR', 'Calcite', 'Poland', 'Baltic coast',
  tags=['fossil'])
t('magneprase', 'Magneprase', 'NR', 'Magnesite; Chalcedony:ASSOCIATED')
t('magnesite', 'Magnesite', 'NM', 'Magnesite')
t('magnesite-wildhorse', 'Wild horse stone', 'NR', 'Magnesite; Hematite:ASSOCIATED')
t('malachite', 'Malachite', 'NM', 'Malachite')
t('malachite-calcite-hematite', 'Malachite with calcite and hematite', 'NM',
  'Malachite; Calcite:ASSOCIATED; Hematite:ASSOCIATED')
t('malachite-chalcedon-breccia', 'Malachite and chalcedony breccia', 'NR', 'Malachite; Chalcedony:ASSOCIATED')
t('maybe-amber', 'Amber?', '', 'Amber')
t('maybe-baryte', 'Baryte?', '', 'Baryte')
t('maybe-baryte-honey', 'Honey baryte?', '', 'Baryte')
t('maybe-black-jasper', 'Black jasper?', '', CH)
t('maybe-chalcedon', 'Chalcedony?', '', CH)
t('maybe-flint-agatized', 'Agatised flint?', '', CH)
t('maybe-milky-rutilated-quartz', 'Milky rutilated quartz?', '', 'Quartz; Rutile:INCLUSION')
t('maybe-opal', 'Opal?', '', 'Opal')
t('maybe-quartz-brecciated', 'Brecciated quartz?', '', 'Quartz')
t('maybe-sapphire', 'Sapphire?', '', 'Corundum')
t('maybe-tectonic-breccia-crete', 'Tectonic breccia?', '', '', 'Greece', 'Crete')
t('maybe-volcanic-gran-canaria', 'Volcanic rock?', '', '', 'Spain', 'Gran Canaria')
t('maybe-volcanic-veined-breccia-gran-canaria', 'Veined volcanic breccia?', '', '', 'Spain', 'Gran Canaria')
t('mica-schist-poland-karwia', 'Mica schist', 'NR', 'Mica; Quartz:ASSOCIATED', 'Poland', 'Karwia')
t('moonstone-white-labradorite', 'Moonstone (white labradorite)', 'NM', 'Labradorite')
t('nephrite', 'Nephrite', 'NR', 'Tremolite; Actinolite:ASSOCIATED')
t('okenite-india', 'Okenite', 'NM', 'Okenite', 'India')
t('opal-blue-Owyhee', 'Blue opal', 'NML', 'Opal', 'USA', 'Owyhee')
t('opal-boulder-koroit-australia', 'Boulder opal', 'NR', 'Opal; Limonite:MATRIX', 'Australia', 'Koroit')
t('opal-ethiopian', 'Ethiopian opal', 'NML', 'Opal', 'Ethiopia')
t('opal-fire-mexican', 'Mexican fire opal', 'NML', 'Opal', 'Mexico')
t('opal-green', 'Green opal', 'NML', 'Opal')
t('orthoceras-fossil', 'Orthoceras fossil', '', '', tags=['fossil'])
t('petrified-wood', 'Petrified wood', '', CH, tags=['fossil'])
t('petrified-wood-peanut', 'Peanut wood', '', CH, tags=['fossil'])
t('phosphosiderite', 'Phosphosiderite', 'NM', 'Phosphosiderite')
t('pietersite', 'Pietersite', 'NR', 'Tiger\'s eye')
t('psilomelane', 'Psilomelane', 'NML', 'Psilomelane')
t('puddingstone', 'Puddingstone', 'NR')
t('pyrite', 'Pyrite', 'NM', 'Pyrite')
t('pyrite-apache-gold', 'Apache gold', 'NR', 'Pyrite')
t('pyrite-iridescent-bulgaria', 'Iridescent pyrite', 'NM', 'Pyrite', 'Bulgaria')
t('pyromorphite-kongo', 'Pyromorphite', 'NM', 'Pyromorphite', 'DR Congo')
t('quartz', 'Quartz', 'NM', 'Quartz')
t('quartz-amethyst', 'Quartz with amethyst', 'NM', 'Quartz; Amethyst:ASSOCIATED')
t('quartz-cleophane-bulgaria', 'Quartz with cleiophane', 'NM', 'Quartz; Sphalerite:ASSOCIATED', 'Bulgaria')
t('quartz-dendritic', 'Dendritic quartz', 'NM', 'Quartz')
t('quartz-druzy-bulgaria', 'Druzy quartz', 'NM', 'Quartz', 'Bulgaria')
t('quartz-fcacture-planes', 'Quartz with fracture planes', 'NM', 'Quartz')
t('quartz-fracture-planes', 'Quartz with fracture planes', 'NM', 'Quartz')
t('quartz-garnet-schorl', 'Quartz with garnet and schorl', 'NM', 'Quartz; Garnet:INCLUSION; Schorl:INCLUSION')
t('quartz-inclusions', 'Quartz with inclusions', 'NM', 'Quartz')
t('quartz-limonite-bulgaria', 'Quartz with limonite', 'NM', 'Quartz; Limonite:ASSOCIATED', 'Bulgaria')
t('quartz-limonite-galena-bulgaria', 'Quartz with limonite and galena', 'NM',
  'Quartz; Limonite:ASSOCIATED; Galena:ASSOCIATED', 'Bulgaria')
t('quartz-rose', 'Rose quartz', 'NM', 'Rose quartz')
t('quartz-rutile-golden', 'Golden rutilated quartz', 'NM', 'Quartz; Rutile:INCLUSION')
t('quartz-smoky-rutile', 'Smoky rutilated quartz', 'NM', 'Smoky quartz; Rutile:INCLUSION')
t('quartz-sphalerite-hematite-bulgaria', 'Quartz with sphalerite and hematite', 'NM',
  'Quartz; Sphalerite:ASSOCIATED; Hematite:ASSOCIATED', 'Bulgaria')
t('quartz-super-seven', 'Super seven', 'NM', 'Amethyst; Goethite:INCLUSION; Rutile:INCLUSION')
t('quartz-vein-poland-baltic', 'Quartz vein', 'NR', 'Quartz', 'Poland', 'Baltic coast')
t('rhodonite', 'Rhodonite', 'NM', 'Rhodonite')
RHY = 'Quartz; Feldspar:ASSOCIATED'
t('rhyolite-amygdaloidal', 'Amygdaloidal rhyolite', 'NR', RHY)
t('rhyolite-dendritic', 'Dendritic rhyolite', 'NR', RHY)
t('rhyolite-gary-green-larsonite', 'Gary green (larsonite)', 'NR', RHY)
t('rhyolite-quartz', 'Rhyolite with quartz', 'NR', RHY)
t('rodochrosite', 'Rhodochrosite', 'NM', 'Rhodochrosite')
t('ruby-fuchsite', 'Ruby in fuchsite', 'NR', 'Corundum; Fuchsite:MATRIX')
t('schale-copper-silver-poland-lubin', 'Copper-silver shale', 'NR', 'Copper; Silver:ASSOCIATED', 'Poland', 'Lubin')
t('schalenblende-poland-olkusz', 'Schalenblende', 'NM', 'Sphalerite; Galena:ASSOCIATED', 'Poland', 'Olkusz')
t('schattuckite', 'Shattuckite', 'NM', 'Shattuckite')
t('scheelite', 'Scheelite', 'NM', 'Scheelite')
t('septaria-gypsum', 'Septarian nodule with gypsum', 'NR', 'Calcite; Gypsum:ASSOCIATED')
t('septaria-yellow', 'Yellow septarian nodule', 'NR', 'Calcite')
t('serafinite', 'Seraphinite', 'NM', 'Clinochlore')
t('shell', 'Shell', 'NO')
t('silicon', 'Silicon', 'A', 'Silicon')
t('snowflake-obsidian', 'Snowflake obsidian', 'NR', 'Volcanic glass')
t('sodalite', 'Sodalite', 'NM', 'Sodalite')
t('sonora-sunrise', 'Sonora sunrise', 'NR', 'Chrysocolla')
t('stichtite-serpentine-atlantisite', 'Atlantisite', 'NR', 'Serpentine; Stichtite:INCLUSION')
t('stilbite', 'Stilbite', 'NM', 'Stilbite')
t('sugilite-wannabe', 'Sugilite wannabe', '', '', marketName='Sugilite')
t('sunstone', 'Sunstone', 'NM', 'Feldspar')
t('tiger-iron', 'Tiger iron', 'NR', 'Tiger\'s eye; Hematite:ASSOCIATED; Chalcedony:ASSOCIATED')
t('tigers-eye', 'Tiger’s eye', 'NM', 'Tiger\'s eye')
t('tigers-eye-brecciated', 'Brecciated tiger’s eye', 'NM', 'Tiger\'s eye')
t('tigers-eye-radial', 'Radial tiger’s eye', 'NM', 'Tiger\'s eye')
t('tigers-hawks-eye', 'Tiger’s eye and hawk’s eye', 'NM', 'Tiger\'s eye')
t('turquoise', 'Turquoise', 'NM', 'Turquoise')
t('unakite', 'Unakite', 'NR', 'Epidote; Quartz:ASSOCIATED; Orthoclase:ASSOCIATED')
t('unknown', 'Unknown')
t('unknown-poland', 'Unknown', '', '', 'Poland')
t('vanadinite-baryte-goethite-morocco', 'Vanadinite with baryte and goethite', 'NM',
  'Vanadinite; Baryte:ASSOCIATED; Goethite:ASSOCIATED', 'Morocco')
t('vanadynite', 'Vanadinite', 'NM', 'Vanadinite')
t('variscite-utah', 'Variscite', 'NM', 'Variscite', 'USA', 'Utah')
t('vivianite-ludlamite-brasil', 'Vivianite with ludlamite', 'NM', 'Vivianite; Ludlamite:ASSOCIATED', 'Brazil')
t('wavellite-usa', 'Wavellite', 'NM', 'Wavellite', 'USA')
t('zarinite', 'Zarinite')


def jasper(base):
    """Every other jasper-*: a rock of microcrystalline quartz, named after its trade name."""
    words = base.split('-')[1:]
    special = {'cherrycreek': 'Cherry Creek', 'dragonblood': 'Dragon blood', 'rocky': 'Rocky', 'butte': 'Butte'}
    country = 'Ukraine' if 'ukraine' in words else None
    words = [w for w in words if w != 'ukraine']
    name = ' '.join(special.get(w, w) for w in words)
    comps = {'dragonblood': 'Epidote', 'bumblebee': 'Calcite; Sulfur:ASSOCIATED; Pyrite:ASSOCIATED',
             'hematitic': 'Chalcedony; Hematite:INCLUSION', 'kambaba': '', 'porcelain': '',
             'rainforest': RHY}.get(words[0] if words else '', CH)
    if words[:3] == ['rainforest', 'amethyst', 'geode']:
        return ('Rainforest jasper with amethyst geode', N['NR'], RHY + '; Amethyst:ASSOCIATED', None, None, {})
    if words == ['spherulitic', 'nut']:
        name = 'Spherulitic jasper nut'
    elif words == ['turtle', 'geodes']:
        name = 'Turtle jasper geode'
    else:
        name = (name + ' jasper').strip()
    name = 'Mookaite' if words == ['mookaite'] else name
    return (name[0].upper() + name[1:], N['NR'], comps, country, None, {})


def natural_key(s):
    return [int(p) if p.isdigit() else p.lower() for p in re.split(r'(\d+)', s)]


def call(method, path, body=None):
    req = urllib.request.Request(API + path, method=method, data=json.dumps(body).encode() if body else None,
                                 headers={'Content-Type': 'application/json', 'X-Rock-Collection': 'import'})
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read() or 'null')


materials = {m['name']: m['id'] for m in call('GET', '/materials')}
folders = sorted((d for d in os.listdir(ROOT) if os.path.isdir(os.path.join(ROOT, d))), key=natural_key)
if any(re.match(r'\d{3}-', d) for d in folders):
    sys.exit('Some folders already start with a number; stopping so nothing is imported twice.')

plan = []
for d in folders:
    base = re.sub(r'-\d+$', '', d)
    row = T.get(base) or (jasper(base) if base.startswith('jasper') else None)
    if not row:
        sys.exit(f'No reading for folder {d}')
    name, nature, comps, country, locality, extra = row
    components = []
    for c in filter(None, (x.strip() for x in comps.split(';'))):
        mat, _, role = c.partition(':')
        if mat not in materials:
            sys.exit(f'{d}: material {mat} is not in the list')
        components.append({'materialId': materials[mat], 'role': role or 'HOST', 'certainty': 'TENTATIVE'})
    body = {'name': name, 'nature': nature, 'components': components, 'country': country, 'locality': locality,
            'tags': extra.get('tags', []), 'marketName': extra.get('marketName'),
            'treatmentNotes': extra.get('treatmentNotes'), 'published': True, 'gone': False}
    plan.append((d, body, comps))

for d, b, comps in plan:
    print(f"{d:48} {b['name']:40} {b['nature'] or '-':20} {comps or '-'} {b['country'] or ''} {b['locality'] or ''}")
print(len(plan), 'folders')
if not GO:
    sys.exit()

log_path = os.path.join(ROOT, '_import-log.csv')
with open(log_path, 'w', newline='', encoding='utf-8') as log:
    w = csv.writer(log)
    w.writerow(['id', 'old folder', 'new folder', 'name'])
    for d, b, _ in plan:
        created = call('POST', '/specimens', b)
        new = f"{created['id']:03d}-{d}"
        try:
            os.rename(os.path.join(ROOT, d), os.path.join(ROOT, new))
        except OSError as e:
            print(f'NOT RENAMED {d} -> {new}: {e}')
            new = f'NOT RENAMED (should be {new})'
        w.writerow([created['id'], d, new, b['name']])
        log.flush()
print('done; log in', log_path)
