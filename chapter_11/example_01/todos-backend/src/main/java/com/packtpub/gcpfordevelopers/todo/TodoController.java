package com.packtpub.gcpfordevelopers.todo;

import com.google.common.hash.Hashing;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.sleuth.annotation.NewSpan;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * TodoController is a simple REST Controller for performing CRUD operations
 * on the todos table of our Cloud SQL database. All operations are available
 * at /api/todos, and include the following endpoints:
 *
 * - GET    /api/todos       // returns all todos
 * - GET    /api/todos/{id}  // returns a single record by ID
 * - POST   /api/todos       // creates a new record and returns the ID
 * - PUT    /api/todos/{id}  // updates an existing record, the ID must exist
 * - DELETE /api/todos/{id}  // deletes the record at ID
 */
@RestController
@RequestMapping("/api/todos")
public class TodoController {
    private final static Logger logger = LoggerFactory.getLogger(TodoController.class);
    private TodoRepository todoRepository;

    @Autowired
    public TodoController(TodoRepository todoRepository) {
        this.todoRepository = todoRepository;
    }

    @RequestMapping(method = RequestMethod.GET)
    @NewSpan
    public List<Todo> getTodos() {
        logger.info("Fetching all todos");
        List<Todo> todos = todoRepository.findAll();

        logger.info("Found {} todos, returning", todos.size());
        return todos;
    }

    @RequestMapping(method = RequestMethod.GET, path = "/{id}")
    @NewSpan
    public Todo getTodoById(@PathVariable Long id) {
        logger.info("Fetching todo %d", id);
        Todo todo = todoRepository.findById(id)
                .orElseThrow(() -> new TodoNotFoundException(id));

        logger.info("Returning Todo {}: {}", id, todo.getId(), todo.getTask());
        return todo;
    }

    @RequestMapping(method = RequestMethod.POST)
    @ResponseStatus(HttpStatus.CREATED)
    @NewSpan
    public Todo createTodo(@RequestBody Todo todo) {
        logger.info("Creating todo: {}", todo.getTask());

        //region Stackdriver Debugger
        processTask(todo.getTask());
        //endregion

        Todo result = todoRepository.saveAndFlush(todo);
        logger.info("Todo created with ID {}", result.getId());
        return result;
    }

    @RequestMapping(method = RequestMethod.PUT, path = "/{id}")
    @ResponseStatus(HttpStatus.ACCEPTED)
    @NewSpan
    public Todo updateTodo(@PathVariable Long id, @RequestBody Todo todo) {
        logger.info("Updating todo {}", id);
        todo.setId(id);

        //region Stackdriver Error Reporting
        if (id % 2 == 1) {
            RuntimeException fakeException = new RuntimeException ("unknown error");
            logger.error("Failed to update Todo:", fakeException);
            throw fakeException;
        }
        //endregion

        if (!todoRepository.existsById(id)) {
            logger.info("Client attempted to update non-existent Todo {}", id);
            throw new TodoBadRequestException();
        }

        return todoRepository.saveAndFlush(todo);
    }

    @RequestMapping(method = RequestMethod.DELETE, path = "/{id}")
    @NewSpan
    public void deleteTodo(@PathVariable Long id) throws InterruptedException {
        logger.info("Deleting todo {}", id);

        //region Stackdriver Trace
        Thread.sleep(3000);
        //endregion

        todoRepository.deleteById(id);
    }

    /**
     * For demonstration purposes, we take a SHA 256 hash of each word
     * in the task and compare it's first seven characters to a known value.
     * The nature of this operation means it may be hard to recreate
     * conditions locally. Instead, we rely on Stackdriver Debugger.
     */
    private void processTask(String task) {
        for(String word : task.toLowerCase().split(" ")) {
            String wordHash = Hashing.sha256()
                    .hashString(word, StandardCharsets.UTF_8).toString();
            String invalidHash = "7edb360";
            if (wordHash.startsWith(invalidHash)) {
                throw new RuntimeException("failed to process todo: invalid hash");
            }
        }
    }

    @ResponseStatus(HttpStatus.NOT_FOUND)
    public class TodoNotFoundException extends RuntimeException {
        public TodoNotFoundException(Long id) {
            super("Todo does not exist for ID " + id);
        }
    }

    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public class TodoBadRequestException extends RuntimeException {
        public TodoBadRequestException() {
            super("Bad request on Todo API");
        }
    }
}
