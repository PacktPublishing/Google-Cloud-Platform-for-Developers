package com.packtpub.gcpfordevelopers.todo;

import org.springframework.cloud.sleuth.annotation.NewSpan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * This interface will be implemented by Spring at runtime.
 * We leverage JPA auto-configuration to create the underlying
 * tables for us.
 *
 * When running locally, this will leverage an H2 in-memory database.
 * When running in App Engine, we use Spring Cloud GCP to provision
 * a Cloud SQL connection for us via the Google Cloud SQL socket factory.
 *
 * We instrument the methods used in @TodoController here for the sake of
 * demonstration.
 */
public interface TodoRepository extends JpaRepository<Todo, Long> {
    @NewSpan
    public abstract java.util.List<Todo> findAll();
    @NewSpan
    public abstract Optional<Todo> findById(Long id);
    @NewSpan
    public abstract <S extends Todo> S saveAndFlush(S entity);
    @NewSpan
    public abstract boolean existsById(Long id);
    @NewSpan
    public abstract void deleteById(Long id);
}
