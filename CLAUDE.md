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
- **Visual style:** **Material You / Material Design 3**, readable and modern, even though this is a desktop-first web app. Achieve it by **restyling MUI with a custom theme** (MUI implements Material Design 2). Do not switch to a different component library. See **Theme** under Frontend.

### Publishing

- **Where the site lives:** a **separate public GitHub repo**, [`diantris/rock-collection-page`](https://github.com/diantris/rock-collection-page) (branch `main`, served at <https://diantris.github.io/rock-collection-page/>). Until step 4 it only holds a README and the uploaded photos (`photos/{specimenId}/…`).
- **This repo is public too.** The `rockuser` / `rockpass` credentials in it are local-dev defaults only. Real deployments (GCP) must use different credentials supplied through env vars or Secret Manager. Never commit real secrets, tokens or the owner's personal data here.
- **How it's triggered:** a **"Publish" button in the private app**. No local scripts are involved.
- **What publish does:** the backend regenerates the whole site (HTML/CSS/JS plus data) from the current DB state. It pushes the result as **one commit** to the Pages repo through the GitHub API (the Git Data API: create a tree, then a commit, then update the ref), not one commit per file.
- **Repeated publishes:** publishing again replaces the generated pages but leaves the photos alone.
- **GitHub token:** a fine-grained personal access token scoped to the Pages repo only (permission *Contents: Read and write*; *Metadata: Read-only* is added automatically). Locally it lives in the gitignored root `.env` (`GITHUB_TOKEN=…`, template in `.env.example`), which `docker compose` passes to the API; on GCP it will come from Secret Manager. Never commit it, and never ask the owner to paste it into the chat.

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

## Current state (as of Day 8)

**Already built:**
- the specimen data model (roadmap step 1)
- a REST API for specimens and materials
- a server-paged, server-sorted specimen table with a column picker
- the full add/edit form, the detail view and the Material You theme (roadmap step 2)
- the photo pipeline (roadmap step 3): upload, resize, EXIF/GPS stripping, push to the Pages repo, DB thumbnails, the gallery

**Not built yet:**
- photo captions in the UI (the column exists, nothing edits it)
- editing or deleting materials in the UI (the API supports both)
- the publish settings table and the static export
- GCP deployment

**Agreed roadmap:**
1. ~~New specimen data model~~ (done, Day 7)
2. ~~Full add/edit forms and the Material You restyle~~ (done, Day 7)
3. ~~Thumbnail upload and the photo pipeline~~ (done, Day 8)
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
- **`specimen_photo`** (`photo/SpecimenPhoto`): `file_name` (path in the Pages repo, unique, e.g. `photos/142/142-3f9a1c2e.jpg`), `caption`, `position` (0 = cover) and the published `width` / `height`. It refers to the specimen by a plain `specimen_id` column; the `Specimen` entity has no photo collection.
- **`specimen_thumbnail`** (`photo/SpecimenThumbnail`): one 192px square JPEG per specimen (`bytea`) plus `updated_at`, in its own table so specimen queries never load image bytes. It's made from the cover photo.
- V1–V3 are the old rock/group schema, and V4 drops it. V5 adds the photo details (thumbnail `updated_at`, photo `width` / `height`, unique `file_name`). Never edit a migration that has run anywhere; always add `V{n+1}__*.sql`. (V4 was still edited on Day 7, because it hadn't run anywhere yet.)
- **Type and family in the table** come from the specimen's primary component (`Specimen.primaryComponent()`: the first HOST component, otherwise the first component). With no components, both show as unknown.

### Backend (`com.rockcollection`, feature packages)

- `specimen/` holds the entities `Specimen` and `SpecimenComponent`, the enums, the repositories, `SpecimenService` and `SpecimenController`, and `SpecimenDto` (records: `Request`, `Summary`, `Detail`, `Component`, `ComponentRequest`).
- `material/` holds `Material`, `MaterialCategory`, the repository, the service, the controller and `MaterialDto`.
- `photo/` holds the photo pipeline:
  - `ImageProcessor` (Thumbnailator): web photos at most 1600px on the long edge (never enlarged), JPEG quality 0.85; thumbnails 192px square, centre-cropped. It applies the EXIF orientation, flattens transparency onto white, and re-encodes from pixels, so **no metadata survives** (EXIF, GPS, camera). Only formats ImageIO reads (JPEG, PNG, GIF, BMP); HEIC is refused with a 400.
  - `PhotoService`: an upload processes every file first (a bad file fails the whole batch before anything is pushed), then commits them all in **one** commit, then saves the rows. The first photo of a specimen without photos becomes the thumbnail. Reordering so a different photo is first, or deleting the cover, remakes the thumbnail by downloading the new cover back from GitHub. Deleting a specimen also removes its files from the repo (best effort; it logs and carries on if GitHub is down). Random 8-hex file-name suffixes mean names never repeat.
  - `PhotoController` under `/api/specimens/{id}` (see API).
- `github/` holds `GitHubClient` (Git Data API: blobs, then tree, commit, ref update, so many files and deletions make one commit; also meant for publishing in step 4), `GitHubProperties` (`rockcollection.github.*`) and `GitHubException` (503). Without a token, photo uploads fail with a 503 that names `GITHUB_TOKEN`; everything else works.
- `common/` holds `NotFoundException` (404), `ConflictException` (409) and `PageResponse<T>`.
- `controller/GlobalExceptionHandler` produces the error bodies:
  - validation failures: 400 with `{field: message}`
  - everything else: `{error: message}` with status 400, 404, 409, 413 (upload over 40 MB per file / 400 MB per request) or 503 (GitHub)
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
| DELETE | `/api/specimens/{id}` | 204, or 404 if it doesn't exist. Also removes the specimen's photos from the Pages repo. |
| GET | `/api/specimens/{id}/photos` | Photos, cover first: `{id, fileName, url, caption, position, width, height}`. `url` is a raw.githubusercontent.com link, which works as soon as the commit exists. |
| POST | `/api/specimens/{id}/photos` | Multipart, one or more `files` parts. 201 with all photos. 400 for an unreadable image (named in the message), 503 without GitHub. |
| PUT | `/api/specimens/{id}/photos/order` | Body: every photo id once, in the new order; the first becomes the cover. |
| DELETE | `/api/specimens/{id}/photos/{photoId}` | 204; the next photo becomes the cover if needed |
| GET | `/api/specimens/{id}/thumbnail?v=…` | The JPEG thumbnail, 404 if none. With `v` (the summary's `thumbnailVersion`) it's cached as immutable. |
| GET/POST/PUT/DELETE | `/api/materials[/{id}]` | Returns 409 on a duplicate name, or when deleting a material that's still in use |

### Frontend (`rock-collection-frontend/src`)

- `pages/_app.tsx` sets up the MUI `ThemeProvider` and the `AppCacheProvider` from `@mui/material-nextjs/v16-pagesRouter`. `pages/_document.tsx` server-renders the Emotion styles. The theme itself lives in `theme.ts`.
- `pages/index.tsx` renders `App.tsx`, which renders `specimens/SpecimensTable.tsx`. The table does server-side paging and sorting.
- **Table columns** are defined in `specimens/columns.tsx` (`COLUMNS`).
  - Shown by default: #, Photo, Name, Market name, Type, Family, Where I got it.
  - `ColumnPicker` lets the user choose others. The choice is saved in `localStorage`, per browser.
  - #, Photo and Name are frozen on the left, and the table scrolls sideways.
  - The optional "Scientific identity" column shows materials as chips: filled when confirmed, outlined when tentative.
- **Clicking a row** opens `SpecimenDetailDialog`. It shows every field grouped into sections, and each section lists its unrecorded fields ("Not recorded: …") as a nudge for measurements. Its Edit button opens `SpecimenFormDialog`.
- **`SpecimenFormDialog`** handles both add and edit.
  - Name, market name, tags, form and nature are always visible. Everything else is in collapsible sections (`Accordion`), and each section header shows how many of its fields are filled.
  - Numbers accept decimal commas ("2,65").
  - Luster, transparency, streak, cleavage, fracture and habit offer suggestions from `suggestions.ts`, but free text is still allowed. Hardness has a scratch-test hint.
  - Typing a material that isn't on the list offers "Add … as a new material", which opens `AddMaterialDialog` pre-filled.
  - **"Add & next"** saves the specimen and resets the form for the next one. It keeps the source, where-I-got-it, date, currency and tags, for batch entry.
  - PUT replaces every field, so the form always sends the full request.
- **Photos:**
  - The Photo column shows the thumbnail (`thumbnailVersion` in the summary; `null` means no photo). Clicking it opens `PhotoGallery` directly, not the details.
  - `PhotoGallery` is the shared viewer: arrows, mobile-style dots (the current one is a wider pill), a counter, left/right keys and swipe, wrapping around. It's always near-black, whatever the colour scheme.
  - `PhotosSection` sits at the top of the detail view: tiles, "Add photos" (button or drag and drop), "Make photo n the cover" and "Delete photo n" (with a confirm).
  - The add form has "Choose photos"; they're uploaded right after the specimen is saved, including with "Add & next". If the upload fails, the specimen stays saved and a warning says to add the photos from its details.
- `specimens/` also holds `AddMaterialDialog` and `DeleteSpecimenDialog`.
- **Theme (`theme.ts`): Material You / M3.**
  - **Colours:** generated from `SEED_COLOR` by `@material/material-color-utilities` (`SchemeTonalSpot`). Change that one value to re-colour the whole app.
  - **Light and dark mode** follow the OS, using MUI CSS variables with `colorSchemes`.
  - **Extra colour roles:** M3 roles with no slot in MUI's palette (surface containers, outline, …) live under `theme.vars.palette.m3.*`.
  - **Component overrides:** pill buttons, 28px dialogs, 8px chips, tonal accordions.
  - **Typography:** Roboto via `next/font`, with the M3 type scale mapped onto the MUI variants (h4 = headline large, and so on).
- API calls go in `specimens/api.ts`. It reads `NEXT_PUBLIC_API_URL`, which is baked in at build time (a Docker build arg) and defaults to `http://localhost:8080`. It throws `ApiError`, which carries any field errors.
- Types and enum display labels live in `specimens/types.ts`.
- **MUI 9 removed system props** (`<Stack gap={2}>`, `<Box display="flex">`). Put style values in `sx` instead.
- Playwright tests select elements by role and accessible name. Keep these names stable, or update `test/*.spec.ts` along with them:
  - the heading "Rock Collection"
  - the table "Specimens"
  - the buttons "Add a specimen", "Add & next" and "Delete {name}"
  - the dialogs "Add a specimen", "Edit #{id}", "#{id} {name}" and "Add a material"
  - the detail sections, which are regions named after their titles (including "Photos")
  - the photo controls: "Photos of {name}" (table photo), the dialog "{name} photos", "Previous photo" / "Next photo", "Photo n" (dots, `aria-current` on the shown one), "Close gallery", "Open photo n", "Make photo n the cover", "Delete photo n", the dialog "Delete this photo?", "Choose photos" and the file inputs labelled "Photo files"
- `test/photos.spec.ts` **mocks every photo endpoint and image URL with `page.route`**, because a real upload pushes to the public Pages repo. Keep it that way; test real uploads by hand and delete the test specimen afterwards, which removes its files.

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
- **`next.config.ts` lists `@material/material-color-utilities` in `transpilePackages`.** Version 0.4.0 has an ESM import without a file extension that Node can't resolve during SSR, which made `next build` fail inside Docker. Remove the workaround once upstream fixes it.
- **Check the exit code of `docker compose build`.** A failed image build leaves the old container running, so tests silently run against stale code.
- **MUI `Dialog` only forwards `aria-labelledby` to the paper** (the element with `role="dialog"`). An `aria-label` on `<Dialog>` lands on the backdrop root, so pass it through `slotProps.paper` (as `PhotoGallery` does).
- **While a dialog is open (or fading out), the rest of the page is `aria-hidden`.** Role queries outside it find nothing, so wait for the dialog to be gone, or use CSS locators.
- **GitHub's API caches unauthenticated reads for about a minute.** A `contents/` lookup can still show a just-deleted file; check the tree of the latest commit instead.
- **Playwright accessible names match substrings** ("Name" also matches "Market name", "Where I got it" also matches "Country (where I got it)"). Use `exact: true` for field labels.
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
