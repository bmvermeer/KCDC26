# --- Build the Spring Boot backend -----------------------------------
FROM maven:3.9-eclipse-temurin-21 AS backend-build
WORKDIR /build/backend
COPY backend/pom.xml .
RUN mvn -q -B dependency:go-offline
COPY backend/src ./src
RUN mvn -q -B -DskipTests package

# --- Install the frontend's production node_modules -------------------
# npm install (not npm ci) since package.json gets hand-edited for demo
# purposes (e.g. pinning a vulnerable dependency version) without always
# regenerating package-lock.json to match.
FROM node:20-bookworm-slim AS frontend-build
WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install --omit=dev

# --- Runtime image: Node (front door) + a copied-in JRE (backend) -----
FROM node:20-bookworm-slim
COPY --from=eclipse-temurin:21-jre /opt/java/openjdk /opt/java/openjdk
ENV JAVA_HOME=/opt/java/openjdk
ENV PATH="${JAVA_HOME}/bin:${PATH}"

WORKDIR /app
COPY --from=backend-build /build/backend/target/*.jar backend/app.jar
COPY --from=frontend-build /build/frontend/node_modules frontend/node_modules
COPY frontend/package.json frontend/server.js frontend/
COPY frontend/public frontend/public

COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

ENV BACKEND_PORT=8080
EXPOSE 3000
CMD ["/app/start.sh"]
