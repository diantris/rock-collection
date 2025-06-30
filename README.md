# Rock Collection

> **Note:** This project is being created with the use of GitHub Copilot as a form of training. All code, structure, and documentation are generated or refactored with the assistance of GitHub Copilot to experiment with AI-driven software development workflows.

A full-stack application for managing a rock collection.

## Project Structure

- **Backend:** Java 17, Spring Boot, Maven
- **Frontend:** React, TypeScript
- **Database:** PostgreSQL (via Docker)
- **Containerization:** Docker, Docker Compose

## Features
- View, add, and delete collected rocks
- Manage rock groups and properties
- RESTful API (Spring Boot)
- Persistent PostgreSQL database
- Modular, type-safe React frontend

## Getting Started

### Prerequisites
- [Docker](https://www.docker.com/get-started/)
- [Node.js](https://nodejs.org/) (for frontend development)
- [Java 17](https://adoptopenjdk.net/) (for backend development)

### Running with Docker Compose

1. Clone the repository:
   ```sh
   git clone <repo-url>
   cd rock-collection
   ```
2. Build and start all services:
   ```sh
   docker-compose up --build
   ```
3. The backend API will be available at [http://localhost:8080](http://localhost:8080)
4. The PostgreSQL database will be available at `localhost:5432` (user: `rockuser`, password: `rockpass`, db: `rockdb`)

### Running Frontend Locally

1. Navigate to the frontend directory:
   ```sh
   cd rock-collection-frontend
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start the development server:
   ```sh
   npm start
   ```
4. The app will be available at [http://localhost:3000](http://localhost:3000)

### Running Backend Locally

1. Navigate to the backend directory:
   ```sh
   cd rock-collection-backend
   ```
2. Build the project:
   ```sh
   mvn clean package
   ```
3. Run the application:
   ```sh
   java -jar target/rock-collection-backend-1.0-SNAPSHOT.jar
   ```

## Configuration

- All backend configuration is in `rock-collection-backend/src/main/resources/application.properties`.
- Database connection details are set via environment variables in `docker-compose.yml`.

## Useful Commands

- **Stop all containers:**
  ```sh
  docker-compose down
  ```
- **View logs:**
  ```sh
  docker-compose logs -f
  ```

## Contributing

Pull requests are welcome! Please follow the code style and guidelines in the repository.

## License

This project is open source and available under the [MIT License](LICENSE).
