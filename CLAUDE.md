# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project goal

A personal catalogue of the owner's specimen collection (well over 200 items, and growing). It has two parts:

1. **A private management app** (DB + API + UI) for the owner and their husband. It shows a paged, sortable table, each row with **one** thumbnail photo, and has add/edit/delete. It will be hosted on **GCP**, with access restricted to the owner's static IP. Because the network restriction is the access control, there's no in-app authentication. The full photo set for every specimen lives on the private side.
2. **A public static site generator.** A service that exports the collection, with **all** photos per specimen, to a static site deployed on **GitHub Pages**.

The main purpose of the public site is **crowd-sourced identification**: the owner shares it with geologists and other specialists and asks for their opinions. So:

- **Do not build automated identification** (no AI, photo recognition or property-matching "identify this" features). The owner has explicitly ruled this out.
- Each specimen should record enough observable data for an expert to judge it from the page: photos plus physical properties.

### Image UX

- The table shows a single thumbnail per specimen.
- Clicking it opens a gallery or carousel popup of all the specimen's photos, with mobile-style dot indicators showing the current position.
- Visual style: **Material You / Material Design 3** (Google's latest), readable and modern, even though this is a desktop-first web app. The current UI uses MUI 7, which implements Material Design 2; the move to M3 styling hasn't been decided yet.

### What the collection contains (domain model requirements)

- **Rocks, minerals and cabochons**, including some **man-made** items. Some are kept for sentimental value, for example "Piasek Pustyni", a Polish necklace stone. Record whether a specimen is natural, man-made or treated.
- Many specimens are **combinations**: a host mineral with inclusions or associated minerals (for example quartz with garnet inclusions). A specimen can therefore relate to *several* minerals or rock types, each with a role (host, inclusion, matrix, ...). The current one-group-per-rock `@ManyToOne` model can't express this.
- **Classic descriptive data:** luster, hardness, streak, color, transparency, weight, dimensions, and so on.
- **Provenance:** where or from whom it was acquired, the **seller's/market name** (kept separately from the actual or presumed identity), locality or origin, and acquisition date.
- **Almost every field is optional.** The owner often doesn't remember where a specimen came from, so the UI, API and export must handle missing data gracefully. Show "unknown", don't fail validation, and don't drop rows.
- Identification certainty matters, because the public site asks experts for help. An identity can be known, tentative, seller's claim only, or unknown.

## Current state (as of Day 7)

**Already built:** a single page with a sortable MUI table of collected rocks (name, market name, rock type/group, origin), dialogs to add a rock, add a group and delete a rock, and a REST API backed by PostgreSQL.

**Not built yet:**
- images (there's no image column, upload or storage) and the gallery popup
- table paging in the UI
- editing rocks in the UI (the `PUT` endpoint exists), the `notes` field in the UI, and editing or deleting groups in the UI
- the richer specimen model described above
- the static site export and GitHub Pages deployment
- GCP deployment

## Architecture

Monorepo with three Docker Compose services (`docker-compose.yml`):

| Service    | Dir                         | Stack                                                     | Port |
|------------|-----------------------------|-----------------------------------------------------------|------|
| `db`       | –                           | PostgreSQL 15 (`rockdb` / `rockuser` / `rockpass`)        | 5432 |
| `api`      | `rock-collection-backend/`  | Java 17, Spring Boot 3.2, Spring Data JPA, Flyway, Maven  | 8080 |
| `frontend` | `rock-collection-frontend/` | Next.js 15 (pages router, `src/pages`), React 19, MUI 7, TypeScript, Yarn | 3000 |

### Backend (`com.rockcollection`)

- `model/CollectedRock` is an entity on `collected_rocks`. Each rock is `@ManyToOne` (lazy) to `RockGroupProperties`, an entity on `rock_group_properties` that holds the descriptive properties: family, type, Mohs hardness, color, streak, luster, cleavage/fracture, crystal form, density, transparency, magnetism and notes. Hardness and density are stored as strings.
- `model/Rock` is an unused leftover POJO.
- Rock endpoints go through layers: `RockController` → `RockService` → `repository/RockRepository`. `RockRepository` is a custom `@Repository` that wraps the JPA `CollectedRockRepository` and maps entities to `Map<String,Object>`, using snake_case keys (`name`, `market_name`, `group_name`, `origin`, `group_properties`, ...).
- Group endpoints skip the layers: `GroupController` talks straight to `RockGroupPropertiesRepository` and returns the entity as is, with camelCase JSON (`groupName`, `mohsHardness`, ...).
- `GlobalExceptionHandler` turns validation errors into a 400 response with a `{field: message}` body.
- CORS is open for `/api/**` in `config/WebConfig`. `RockController` also has a redundant `@CrossOrigin`.
- The schema is managed **only by Flyway** (`ddl-auto=none`). To change the schema, add a new `src/main/resources/db/migration/V{n}__*.sql`. Never edit an existing migration. V2 and V3 hold seed data, and the API tests assume group `id=1` exists.

### API

| Method | Path | Notes |
|---|---|---|
| GET | `/api/rocks?page=N` | **Paginated, 10 per page** (hard-coded in `RockRepository.fetchRocks`). Returns a flat snake_case list. |
| GET | `/api/rocks/{id}` | Detail with nested `group_properties` and `notes` |
| POST / PUT | `/api/rocks[/{id}]` | Body uses **entity** field names: `{rockName, marketName, origin, notes, group: {id}}` |
| DELETE | `/api/rocks/{id}` | 204 / 404 |
| GET/POST/PUT/DELETE | `/api/groups[/{id}]` | Entity JSON in camelCase |

Watch the naming mismatch: rock **reads** are snake_case maps, rock **writes** and all group JSON are camelCase.

### Frontend (`rock-collection-frontend/src`)

- `pages/index.tsx` renders `App.tsx`, which renders `CollectedRocksTable.tsx`. That component holds all the state: rocks, sorting, and the add-rock, add-group and delete dialogs.
- The presentational pieces are `CollectedRocksTableHeader`, `CollectedRockRow`, `AddRockDialog`, `AddGroupDialog` and `DeleteRockDialog`.
- `rockUtils.ts` holds the `fetch`-based API calls and client-side sorting. `axios` is a dependency but isn't used.
- The shared types `CollectedRock`, `RockGroup`, `SortKey` and `Order` are exported from `CollectedRocksTable.tsx`.
- Accessibility: the components set ARIA roles and labels, and the Playwright UI tests select elements by role and name (for example, the heading "Collected Rocks", the button "Add a rock" and the column headers). Keep those names stable, or update `test/ui.spec.ts` along with them.
- Icons come from both FontAwesome (trash icon) and `@mui/icons-material`.

## Commands

```sh
# Everything in Docker
docker-compose up --build
docker-compose up db api          # then run the frontend locally
docker-compose up db              # then run backend + frontend locally

# Backend (from rock-collection-backend/)
mvn spring-boot:run               # needs db on localhost:5432
mvn test                          # JUnit 5 + Mockito unit tests (controllers, mocks only, no DB)
mvn test -Dtest=RockControllerTest

# Frontend (from rock-collection-frontend/) — use yarn, not npm
yarn install
yarn dev                          # dev server on :3000
yarn build && yarn start

# Playwright tests (from rock-collection-frontend/) — need the full stack running
npx playwright test               # all of test/
npx playwright test test/api.spec.ts
```

There's no `playwright.config.ts` and no `test` script in `package.json`. The tests use hard-coded `http://localhost:3000` and `API_BASE_URL` (default `http://localhost:8080/api`). The README's `npm install` / `npm start` instructions are out of date.

## Known issues / gotchas

- **The frontend only ever shows the first 10 rocks.** `fetchRocks()` calls `/api/rocks` without a page number, and the backend pages at 10.
- **The API URL env var does nothing in Next.js.** `rockUtils.ts` reads `process.env.REACT_APP_API_URL`, a leftover from Create React App. Next.js only exposes variables prefixed with `NEXT_PUBLIC_` to the browser, so the code always falls back to `http://localhost:8080`, which happens to be the right address.
- **Deleting a group that rocks still use fails.** The foreign key constraint makes it return a 500 error, and nothing handles that case.
- The rock group model mixes rock-level properties (family, type) with mineral-level ones (streak, cleavage, crystal form). The seed data is placeholder quality.
- `tsconfig.json` only includes `src`, so `test/*.spec.ts` isn't type-checked by `tsc`.
- `.gitignore` excludes `package-lock.json`. Yarn is the package manager, and `yarn.lock` is committed.

## Conventions

- **Commit messages use the format `Day N: <summary>`.** N counts the separate days the owner has worked on the project, and they want to see the final count at the end. Look at `git log` for the latest N. Reuse it for more commits on the same day, and add one on a new day.
- The project started with GitHub Copilot (Days 1–6) and switched to Claude Code on Day 7. The Copilot instruction files were removed then; this file replaces them.

- Backend: standard Maven layout. Use Java 17 features, Spring Boot and JPA/Hibernate, and put configuration in `application.properties`, overridden by env vars in Docker. Inject dependencies with `@Autowired`, which the existing code puts on fields. Add JUnit 5 + Mockito tests for new controllers and services.
- Frontend: TypeScript strict mode and MUI components. Keep API calls in `rockUtils.ts`, or in a dedicated API module if that file grows. Add ARIA roles and labels to new interactive elements, and Playwright tests for new UI flows.
- Comment code at about the density the existing files have: a header comment per file and JSDoc on public methods.
