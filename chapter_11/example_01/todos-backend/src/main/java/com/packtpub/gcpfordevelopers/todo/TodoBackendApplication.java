package com.packtpub.gcpfordevelopers.todo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/***
 * This is a very simple Spring Boot web service that provides
 * a thin REST API on top of our todos-db Cloud SQL instance.
 * @see TodoController
 * @see TodoRepository
 */
@SpringBootApplication
public class TodoBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(TodoBackendApplication.class, args);
    }
}
