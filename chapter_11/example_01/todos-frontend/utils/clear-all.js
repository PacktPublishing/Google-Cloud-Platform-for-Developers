const axios = require('axios');
const host = process.env.npm_package_config_target || 'localhost:5000'

axios.get(`${host}/api/todos`)
  .then(res => {
    console.log(`Found ${res.data.length} Todos.`);
    res.data.map(e => e.id).forEach(deleteTodo);
  })
  .catch(err => console.error('Failed to fetch todos:', err.message));

function deleteTodo(id) {
  console.log('Deleting todo ' + id);
  axios.delete(`${host}/api/todos/${id}`)
    .then(() => console.log(`Todo ${id} deleted`))
    .catch(err => console.error(`Failed to delete todo ${id}:`, err.message));
}
