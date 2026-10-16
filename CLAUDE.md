# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project goal

A personal catalogue of the owner's specimen collection (well over 200 items, and growing). It has two parts:

1. **A private management app** (DB + API + UI) for the owner and their husband. It shows a paged, sortable table, each row with **one** thumbnail photo, and has add/edit/delete. It will be hosted on **GCP**, with access restricted to the owner's static IP. Because the network restriction is the access control, there's no in-app authentication.
2. **A public static site generator.** A service that exports the collection, with **all** photos per specimen, to a static site deployed on **GitHub Pages**.

The main purpose of the public site is **crowd-sourced identification**: the owner shares it with geologists and other specialists and asks for their opinions. So:

- **Do not build automated identification** (no AI, photo recognition or property-matching "identify this" features). The owner has explicitly ruled this out.
- Each specimen should record enough observable data for an expert to judge it from the page: photos plus physical properties.

### Images

- **Private app:** each specimen has **one small thumbnail stored in the database**, just enough to recognize the stone. The app only stores the *file names and order* of the full photos. It doesn't need to keep the photos themselves.
- **Public site:** the full photos live in the GitHub Pages repo. Each specimen gets a gallery or carousel popup of all its photos, with mobile-style dot indicators showing the current position.
- **Upload flow:**
  1. The owner uploads photos in the private app.
  2. The app makes the thumbnail and keeps it.
  3. The app resizes each full photo to web size, removes **EXIF metadata, especially GPS location**, and pushes it to the Pages repo through the GitHub API.
- **Photos are public once uploaded.** They become visible in the public repo straight away, even before the specimen is published. This was accepted for simplicity, because rock photos aren't sensitive.
- **Size limits:** keep published photos resized (about 1600px, a few hundred KB each). GitHub Pages sites are limited to about 1 GB.
- **Visual style:** **Material You / Material Design 3**, readable and modern, even though this is a desktop-first web app. Achieve it by **restyling MUI with a custom theme** (MUI 7 implements Material Design 2). Do not switch to a different component library.

### Publishing

- **Where the site lives:** a **separate public GitHub repo**. It doesn't exist yet and isn't needed until roadmap step 4.
- **This repo is public too.** The `rockuser` / `rockpass` credentials in it are local-dev defaults only. Real deployments (GCP) must use different credentials supplied through env vars or Secret Manager. Never commit real secrets, tokens or the owner's personal data here.
- **How it's triggered:** a **"Publish" button in the private app**. No local scripts are involved.
- **What publish does:** the backend regenerates the whole site (HTML/CSS/JS plus data) from the current DB state. It pushes the result as **one commit** to the Pages repo through the GitHub API (the Git Data API: create a tree, then a commit, then update the ref), not one commit per file.
- **Repeated publishes:** publishing again replaces the generated pages but leaves the photos alone.
- **GitHub token:** a fine-grained personal access token scoped to the Pages repo only (contents: read/write). It comes from configuration (an env var, or Secret Manager on GCP) and is never committed.

### Public site content

- **Choosing fields to publish:** one **global** set of "publish" checkboxes, one per field, chosen in the Publish dialog and remembered. There are **no per-specimen field toggles**: the owner won't click through hundreds of options. In addition, each specimen has a single `published` flag that decides whether it appears at all.
- **Private fields never leak:** price, seller, `privateNotes` and the like must never end up in the export unless their checkbox is ticked.
- **No comment system.** Contact with experts happens outside the site (email, phone, messenger, in person).
- **Specimen IDs:** each specimen's DB id is its public, stable number ("specimen #142") and is shown on every page. There are no physical labels or catalogue numbers yet.

### UX principle

Keep data entry **low-friction**: sensible defaults, few required fields, no long repetitive click-through flows. Only the specimen name is mandatory. Everything else can be filled in later.

### What the collection contains (domain model requirements)

- **Rocks, minerals and cabochons**, including some **man-made** items. Some are kept for sentimental value, for example "Piasek Pustyni", a Polish necklace stone.
- Many specimens are **combinations**: a host mineral with inclusions or associated minerals (for example quartz with garnet inclusions).
- **Classic descriptive data:** luster, hardness, streak, color, transparency, weight, dimensions, and so on.
- **Provenance:** where or from whom it was acquired, the **seller's name** for it (kept separately from the actual identity), locality, and acquisition date.
- **Almost every field is optional.** The UI, API and export must handle missing data gracefully: show "unknown", don't fail validation, and don't drop rows.

## Current state (as of Day 7)

**Already built:**
- the specimen data model (roadmap step 1)
- a REST API for specimens and materials
- a server-paged, server-sorted specimen table with quick-add, add-material and delete dialogs

**Not built yet:**
- the full add/edit specimen form and a detail view
- the Material You theme
- photos, thumbnails and the gallery
- the publish settings table and the static export
- GCP deployment

**Agreed roadmap:**
1. ~~New specimen data model~~ (done, Day 7)
2. Full add/edit forms and the Material You restyle (paging already done)
3. Thumbnail upload and the photo pipeline
4. Static site export with a gallery
5. GCP deployment

## Architecture

Monorepo with three Docker Compose services (`docker-compose.yml`):

| Service    | Dir                         | Stack                                                                 | Port |
|------------|-----------------------------|-----------------------------------------------------------------------|------|
| `db`       | –                           | PostgreSQL 18 (`rockdb` / `rockuser` / `rockpass`, local-dev only)    | 5432 |
| `api`      | `rock-collection-backend/`  | Java 25 (LTS), Spring Boot 4.1, Spring Data JPA / Hibernate, Flyway, Maven wrapper | 8080 |
| `frontend` | `rock-collection-frontend/` | Next.js 16 (pages router, `src/pages`), React 19, MUI 9, TypeScript 7, Yarn 1 | 3000 |

### Data model (Flyway `V4__Specimen_model.sql`)

**Three levels of naming.** Each specimen has:
- a **name**: what the owner calls it, e.g. "Maw Sit Sit" or "Dalmatian Stone"
- a **market name**: what it was sold as, e.g. "Dalmatian Jasper", or "Fire Agate", which isn't an agate
- a **scientific identity**: its list of components (materials), each tentative or confirmed, e.g. *kosmochlor (host)*, or *peralkaline rock + arfvedsonite + feldspar*

Unknown specimens are the main use case. The owner records measurements and observations, and experts use them to work out what the specimen is.

- **`specimen`:** one physical item. Only `name` is required.
  - **What it is:** `market_name`, `form` (ROUGH, CRYSTAL, TUMBLED, CABOCHON, SPHERE, POINT, FACETED, CARVED, SLAB, BEAD, JEWELRY, OTHER), `nature` (NATURAL, TREATED, SYNTHETIC, MAN_MADE, UNKNOWN) and `treatment_notes`.
  - **Observed or measured on this piece:** these are the evidence used to identify it, so they stay per specimen even when the material is known.
    - `color` and `secondary_color`; luster, transparency and streak (free text; the full form in step 2 should offer suggestions); cleavage and fracture (two separate fields); crystal habit
    - `hardness_min` / `hardness_max` in Mohs. A single value fills both; a reversed range is swapped.
    - `specific_gravity`
    - `special_properties` and `optical_effects`: `VARCHAR[]` arrays of enum names (`SpecialProperty`, `OpticalEffect`), mapped as `List<String>` with `@JdbcTypeCode(SqlTypes.ARRAY)`
    - `inclusions`: free text, for inclusions not yet identified. Identified ones are components.
    - `weight_g`, `length_mm` / `width_mm` / `height_mm`, other observations
  - **Provenance:**
    - `locality` + `country`: where it was (likely) mined
    - `acquisition_type`: the "source" (bought, found, …)
    - `acquired_from` + `acquired_country`: where the owner got it
    - `acquired_year` / `acquired_month` / `acquired_day`: partial dates are allowed, but a full date must exist
    - `price` + `currency`: the currency defaults to PLN when a price is given
  - **Text:** `tags` (`VARCHAR[]`, trimmed, with case-insensitive duplicates removed), `description` (public) and `private_notes` (never exported).
  - **Admin:** `published`, `created_at`, `updated_at`.
- **`material`:** a scientific identity, entered once and shared by every specimen made of it.
  - `name`: the scientific name, unique ignoring case
  - `category`: the "type" (MINERAL, ROCK, ORGANIC, MAN_MADE)
  - `family`: `MaterialFamily`, a chemical class (silicate, carbonate, …) or rock class (igneous, sedimentary, metamorphic)
  - `mineral_group` (free text), `crystal_system`, `formula`, `mindat_url`, and `description` (e.g. mindat's definition)
  - About 65 common materials are seeded. Only well-established classifications are filled in; anything uncertain is left NULL.
- **`specimen_component`:** links a specimen to the materials it consists of, each with a `role` (HOST, INCLUSION, ASSOCIATED, MATRIX), a `certainty` (CONFIRMED, TENTATIVE, SELLER_CLAIM) and a `position`. A specimen with no components counts as **"unidentified"**.
- **`specimen_photo`** (file name, caption, position) and **`specimen_thumbnail`** (bytea, kept in its own table): the tables exist, but nothing maps or uses them yet (roadmap step 3).
- V1–V3 are the old rock/group schema, and V4 drops it. Never edit a migration that has run anywhere; always add `V{n+1}__*.sql`. (V4 was still edited on Day 7, because it hadn't run anywhere yet.)
- **Type and family in the table** come from the specimen's primary component (`Specimen.primaryComponent()`: the first HOST component, otherwise the first component). With no components, both show as unknown.

### Backend (`com.rockcollection`, feature packages)

- `specimen/` holds the entities `Specimen` and `SpecimenComponent`, the enums, the repositories, `SpecimenService` and `SpecimenController`, and `SpecimenDto` (records: `Request`, `Summary`, `Detail`, `Component`, `ComponentRequest`).
- `material/` holds `Material`, `MaterialCategory`, the repository, the service, the controller and `MaterialDto`.
- `common/` holds `NotFoundException` (404), `ConflictException` (409) and `PageResponse<T>`.
- `controller/GlobalExceptionHandler` produces the error bodies:
  - validation failures: 400 with `{field: message}`
  - everything else: `{error: message}` with status 400, 404 or 409
- `config/WebConfig` sets CORS, open for `/api/**`.
- **Service conventions:**
  - Entities never leave the service layer; controllers only see DTO records.
  - Blank strings are stored as `null`, so they show up as "unknown".
  - Collections use `@BatchSize`, to avoid N+1 queries.
  - `spring.jpa.open-in-view=false`, so lazy data must be read inside `@Transactional` service methods.

### API (all JSON camelCase)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/specimens?page=0&size=25&sort=name&direction=asc` | Returns `PageResponse<Summary>` (`content`, `page`, `size`, `totalElements`, `totalPages`). `size` is capped at 100. Sort keys are listed in `SpecimenService.SORTABLE`; unknown keys fall back to id. |
| GET | `/api/specimens/tags` | Every tag in use, for autocomplete |
| GET | `/api/specimens/{id}` | `Detail`, all fields including private ones |
| POST / PUT | `/api/specimens[/{id}]` | `Request`. Only `name` is required. `components: [{materialId, role?, certainty?}]` replaces the whole list; `role` defaults to HOST and `certainty` to TENTATIVE. |
| DELETE | `/api/specimens/{id}` | 204, or 404 if it doesn't exist |
| GET/POST/PUT/DELETE | `/api/materials[/{id}]` | Returns 409 on a duplicate name, or when deleting a material that's still in use |

### Frontend (`rock-collection-frontend/src`)

- `pages/_app.tsx` sets up the MUI `ThemeProvider` and the `AppCacheProvider` from `@mui/material-nextjs/v16-pagesRouter`. `pages/_document.tsx` server-renders the Emotion styles. The theme itself lives in `theme.ts`.
- `pages/index.tsx` renders `App.tsx`, which renders `specimens/SpecimensTable.tsx`. The table does server-side paging and sorting.
- **Table columns** are defined in `specimens/columns.tsx` (`COLUMNS`).
  - Shown by default: #, Photo, Name, Market name, Type, Family, Where I got it.
  - `ColumnPicker` lets the user choose others. The choice is saved in `localStorage`, per browser.
  - #, Photo and Name are frozen on the left, and the table scrolls sideways.
  - The optional "Scientific identity" column shows materials as chips: filled when confirmed, outlined when tentative.
- `specimens/` also holds `AddSpecimenDialog`, `AddMaterialDialog` and `DeleteSpecimenDialog`.
- API calls go in `specimens/api.ts`. It reads `NEXT_PUBLIC_API_URL`, which is baked in at build time (a Docker build arg) and defaults to `http://localhost:8080`. It throws `ApiError`, which carries any field errors.
- Types and enum display labels live in `specimens/types.ts`.
- **MUI 9 removed system props** (`<Stack gap={2}>`, `<Box display="flex">`). Put style values in `sx` instead.
- Playwright tests select elements by role and accessible name. Keep these names stable, or update `test/*.spec.ts` along with them:
  - the heading "Rock Collection"
  - the table "Specimens"
  - the buttons "Add a specimen" and "Delete {name}"

## Commands

```sh
# Everything in Docker (needs Docker Desktop running)
docker compose up --build
docker compose up db api          # then run the frontend locally
docker compose up db              # then run backend + frontend locally
docker compose down -v            # also wipe the DB volume

# Backend (from rock-collection-backend/), JDK 25 must be on PATH / JAVA_HOME
./mvnw spring-boot:run            # needs db on localhost:5432
./mvnw test                       # unit + MockMvc tests, plus DatabaseIntegrationTest (needs Docker)
./mvnw test -Dtest=SpecimenServiceTest

# Frontend (from rock-collection-frontend/) — yarn 1 via corepack, not npm
corepack yarn install
corepack yarn dev                 # dev server on :3000
corepack yarn typecheck
corepack yarn build && corepack yarn start

# Playwright (from rock-collection-frontend/) — needs the full stack running
corepack yarn test:e2e
corepack yarn test:e2e test/api.spec.ts
```

The Playwright tests use `FRONTEND_URL` (default `http://localhost:3000`) and `API_BASE_URL` (default `http://localhost:8080/api`).

## Dev machine notes (owner's Windows PC)

- Temurin JDK 25 is installed via winget at `C:\Program Files\Eclipse Adoptium\jdk-25.*`. There's no global Maven; use `./mvnw`.
- Docker Desktop is installed and needs WSL2. Node 24 is installed, and Yarn runs through `corepack yarn`, because `corepack enable` would need admin rights.

## Known issues / gotchas

- **`DatabaseIntegrationTest` needs Docker running.** It uses Testcontainers with `postgres:18` to run the Flyway migrations, lets Hibernate validate the mappings, and round-trips a fully populated specimen. When Docker is off, `./mvnw test` fails on this class; use `-Dtest='!DatabaseIntegrationTest'` to skip it.
- **`ddl-auto=validate`**: the app refuses to start if the entities and the schema disagree. A new column needs both a migration and the entity field.
- **The naming strategy doesn't split a trailing single capital.** `weightG` maps to `weightg`, not `weight_g`. Give such fields an explicit `@Column(name = ...)`.
- `.gitignore` excludes `package-lock.json`. Yarn is the package manager, and `yarn.lock` is committed.

## Conventions

- **Commit messages use the format `Day N: <summary>`.** N counts the separate days the owner has worked on the project, and they want to see the final count at the end. Look at `git log` for the latest N. Reuse it for more commits on the same day, and add one on a new day.
- The project started with GitHub Copilot (Days 1–6) and switched to Claude Code on Day 7. The Copilot instruction files were removed then; this file replaces them.
- Backend:
  - Use the standard Maven layout, feature packages, and Java 25 features (records, `Math.clamp`, and so on).
  - Use **constructor injection**, not `@Autowired` fields.
  - Put configuration in `application.properties`, overridden by env vars in Docker and on GCP.
  - Add JUnit 5 + Mockito tests for services, and `@WebMvcTest` tests for controllers.
- Frontend:
  - Use TypeScript strict mode and MUI components, styled through `sx`.
  - Keep API calls in `specimens/api.ts`.
  - Give interactive elements accessible names, and add Playwright tests for new UI flows.
- Comment code at about the density the existing files have: a header comment per file and JSDoc on public methods.
