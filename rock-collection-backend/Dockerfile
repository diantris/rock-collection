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
# Sized for a 1 GB VM shared with Postgres (measured with 1 GB / a quarter CPU: ~210 MB idle, levelling off at
# ~560 MB under repeated uploads of 12-200 MP photos). A fixed heap (photos are decoded one at a time), the serial
# GC, only the quick JIT compiler (halves startup on a quarter CPU) and fewer malloc arenas, which otherwise
# reserve memory per thread. maxCachedBufferSize stops the JDK keeping a per-thread off-heap copy as large as
# the biggest upload it has read (without it memory grew ~30 MB per round of large uploads, with no end).
# Override with -e JAVA_TOOL_OPTIONS=... if needed.
ENV JAVA_TOOL_OPTIONS="-Xmx320m -XX:+UseSerialGC -Xss512k -XX:TieredStopAtLevel=1 -XX:ReservedCodeCacheSize=64m -Djdk.nio.maxCachedBufferSize=262144"
ENV MALLOC_ARENA_MAX=2
ENTRYPOINT ["java", "-jar", "app.jar"]
