# Rock Collection

> **Note:** This project is being created with AI assistance as a form of training, to experiment with AI-driven software development workflows. It was started with GitHub Copilot (Days 1–6) and continued with Claude Code from Day 7.

A personal catalogue of a rock, mineral and cabochon collection, built to help identify unknown specimens with the help of experts.

## Project Structure

- **Backend:** Java 25, Spring Boot 4, Spring Data JPA, Flyway, Maven (wrapper included)
- **Frontend:** Next.js 16, React 19, MUI 9, TypeScript
- **Database:** PostgreSQL 18 (via Docker)
- **Hosting:** the app's files and HTTPS by Caddy, on one small cloud VM that updates itself from the images CI publishes ([deploy/](deploy/README.md))
- **Tests:** JUnit 5 + Testcontainers (backend), Playwright (end-to-end)

## Features

- Paged, sortable table of specimens with selectable columns
- Specimens with a name, market name and a scientific identity made of several materials (host, inclusions, matrix…), each confirmed or tentative
- Observed properties per specimen (hardness, streak, luster, specific gravity, optical effects, …) as evidence for identification
- Reference list of materials with type, family, mineral group and crystal system
- Photos: resized, stripped of EXIF/GPS metadata and stored in the public site's GitHub repo, with a table thumbnail and a swipeable gallery
- A "Publish" button that generates a static public site on GitHub Pages, with one global choice of which fields to show (private notes are never published)
- An optional message box on each public page, so experts without any account can send the owner a private note ([scripts/message-box](scripts/README.md))

The public site: <https://diantris.github.io/rock-collection-page/>

## Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/get-started/)
- [Node.js 24](https://nodejs.org/) (frontend development; Yarn 1 runs via `corepack yarn`)
- [JDK 25](https://adoptium.net/) (backend development; Maven is provided by `./mvnw`)

### GitHub token for photos

Photos are stored in the public site's repo ([diantris/rock-collection-page](https://github.com/diantris/rock-collection-page)). To upload them, copy `.env.example` to `.env` (git ignores it) and set `GITHUB_TOKEN` to a fine-grained personal access token limited to that repo, with the permission *Contents: Read and write*. Everything else works without it.

### Running everything with Docker Compose

```sh
docker compose up --build
```

If Compose refuses to build (seen on Windows with newer Docker versions), build the two images with plain `docker build -t rock-collection-api ./rock-collection-backend` and `docker build -t rock-collection-frontend ./rock-collection-frontend`, then `docker compose up -d --no-build`.

- Frontend: <http://localhost:3000>
- API: <http://localhost:8080/api/specimens>
- PostgreSQL: `localhost:5432` (user `rockuser`, password `rockpass`, db `rockdb` — local development only)

### Running parts locally

```sh
docker compose up db                       # database only

cd rock-collection-backend
./mvnw spring-boot:run                     # API on :8080
./mvnw test                                # unit + integration tests (integration tests need Docker)

cd rock-collection-frontend
corepack yarn install
corepack yarn dev                          # frontend on :3000
corepack yarn test:e2e                     # Playwright tests (full stack must be running)
```

## Tests and deployment

Every pull request runs the backend tests, the frontend typecheck and build, and builds both Docker images ([ci.yml](.github/workflows/ci.yml)). A merge to `master` publishes the images, and the VM picks them up within five minutes. [deploy/README.md](deploy/README.md) is the step-by-step guide to setting up such a VM.

The app has no login: it's meant to be reachable only from trusted addresses (a firewall rule), so don't expose it to the internet as it is.

## Useful Commands

```sh
docker compose down        # stop all containers
docker compose down -v     # stop and wipe the database volume
docker compose logs -f     # follow logs
```

## License

This project is open source and available under the [MIT License](LICENSE).
