<template>
  <v-app>

    <v-toolbar dark fixed app>
      <img src="./assets/stackdriver.png" width="40" height="auto" />
      <v-toolbar-title>Stackdriver Todos</v-toolbar-title>
    </v-toolbar>

    <v-content>

      <div class="loading-center" v-if="loading.visible">
        <v-progress-circular :size="50" class="mx-auto"
          indeterminate color="primary">
        </v-progress-circular>
      </div>

      <TodoList
        :items="todos"
        :change="fetchTodos"
        v-if="todos"
        :progress="loading"
      ></TodoList>

      <CreateTodo
        :show="showCreateDialog"
        :complete="dialogComplete"
        :progress="loading"
      ></CreateTodo>

    </v-content>

    <v-btn color="pink" dark fixed
           bottom right fab
           @click="showCreateDialog = true">
      <v-icon>add</v-icon>
    </v-btn>

  </v-app>
</template>

<script>
import axios from "axios";
import TodoList from "./components/TodoList.vue";
import CreateTodo from "./components/CreateTodo.vue";

export default {
  name: "app",
  components: {
    TodoList,
    CreateTodo
  },
  data() {
    return {
      todos: null,
      showCreateDialog: false,
      loading: { visible: false }
    };
  },
  methods: {
    fetchTodos: function() {
      var vm = this;
      vm.loading.visible = true;
      axios.get("/api/todos").then(res => {
        vm.todos = res.data;
        vm.loading.visible = false;
      });
    },
    dialogComplete: function(todo) {
      if (todo) {
        this.todos.push(todo);
      }
      this.showCreateDialog = false;
    }
  },
  mounted() {
    this.fetchTodos();
  }
};
</script>

<style scoped>
.loading-center {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  z-index: 1000;
  background-color: rgba(0, 0, 0, 0.15);
  position: fixed;
}
</style>
