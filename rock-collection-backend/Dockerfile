# Build the Spring Boot fat jar with the Maven wrapper
FROM eclipse-temurin:25-jdk AS build
WORKDIR /app
# Resolve dependencies first so they are cached between source changes
COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN chmod +x mvnw && ./mvnw -B -q dependency:go-offline
COPY src src
RUN ./mvnw -B -q package -DskipTests

# Run on a minimal JRE image
FROM eclipse-temurin:25-jre
WORKDIR /app
COPY --from=build /app/target/rock-collection-backend-1.0-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
