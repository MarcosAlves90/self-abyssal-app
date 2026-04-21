ARG SERVICE_NAME

FROM maven:3.9.9-eclipse-temurin-17 AS build
ARG SERVICE_NAME
WORKDIR /workspace

COPY pom.xml ./
COPY shared/pom.xml shared/pom.xml
COPY identity-service/pom.xml identity-service/pom.xml
COPY catalog-service/pom.xml catalog-service/pom.xml
COPY operations-service/pom.xml operations-service/pom.xml

RUN mvn -q -pl ${SERVICE_NAME} -am dependency:go-offline

COPY shared/src shared/src
COPY identity-service/src identity-service/src
COPY catalog-service/src catalog-service/src
COPY operations-service/src operations-service/src

RUN mvn -q -pl ${SERVICE_NAME} -am package -DskipTests

FROM eclipse-temurin:17-jre-jammy
ARG SERVICE_NAME
WORKDIR /app

COPY --from=build /workspace/${SERVICE_NAME}/target/${SERVICE_NAME}-*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
