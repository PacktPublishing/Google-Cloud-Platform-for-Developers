FROM openjdk:8
ADD . /sources
WORKDIR /sources
RUN ./gradlew assemble \
    && cp build/libs/*.jar /app.jar

FROM gcr.io/google-appengine/openjdk
EXPOSE 8080
COPY --from=0 /app.jar /app.jar
CMD java -jar app.jar
