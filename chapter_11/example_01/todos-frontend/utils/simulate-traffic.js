const axios = require('axios');
const loremIpsum = require('lorem-ipsum');

const requestsPerSecond = 1;
const host = process.env.npm_package_config_target || 'localhost:5000'
const todos = [];
const timeouts = [];

console.log('targeting', host);

setInterval(() => {
  createTodo();
}, (1000 / requestsPerSecond));

/**
 *  Generates a random wait time between one and ten seconds.
 */
function randomlyDelay(callback, todo) {
  const delay = Math.floor(Math.random() * 9000) + 1000
  setTimeout(() => {
    callback(todo)
      .catch(err => {
        console.log('operation failed, attempting to delete');
        deleteTodo(todo);
      });
  }, delay);
}

/**
 * Create a random Todo
 */
function createTodo() {
  const todo = {
    task: loremIpsum(),
    notes: loremIpsum()
  };
  console.log('creating todo');
  return axios.post(`${host}/api/todos`, todo)
    .then(res => {
      todos.push(res.data);
      randomlyDelay(completeTodo, res.data);
    });
}

/**
 * Mark the todo as complete
 */
function completeTodo(todo) {
  console.log('completing todo ' + todo.id);
  todo.complete = true;
  return axios.put(`${host}/api/todos/${todo.id}`, todo)
    .then(res => randomlyDelay(deleteTodo, todo));
}

/**
 * Delete the todo
 */
function deleteTodo(todo) {
  console.log('deleting todo ' + todo.id);
  return axios.delete(`${host}/api/todos/${todo.id}`)
    .then(res => {
      todos.splice(todos.indexOf(todo), 1);
    });
}

