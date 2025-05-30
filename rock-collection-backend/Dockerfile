# Use Maven to build the Spring Boot fat jar
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY . .
RUN mvn clean package spring-boot:repackage -DskipTests

# Use a minimal JRE image for running the app
FROM openjdk:17-jdk-slim
WORKDIR /app
COPY --from=build /app/target/rock-collection-backend-1.0-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]

