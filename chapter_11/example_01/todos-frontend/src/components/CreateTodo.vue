<template>

  <v-dialog v-model="show" max-width="500px">
    <v-card>
      <v-card-title>
        <span center class="headline">Add a Todo</span>
      </v-card-title>
      <v-card-text>
        <v-form ref="form" v-model="valid" lazy-validation>

          <v-text-field label="Task" v-model="newTodo.task" :rules="taskRules" required maxlength="255"></v-text-field>
          <v-text-field label="Notes" v-model="newTodo.notes" multi-line maxlength="255"></v-text-field>

          <v-btn color="primary" flat :disabled="!valid" @click.stop="createTodo(newTodo)">Save</v-btn>
          <v-btn flat @click.stop="complete()">Cancel</v-btn>

        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>

</template>

<script>
import axios from "axios";

export default {
  name: "TodoList",
  props: {
    items: Array,
    show: Boolean,
    complete: Function,
    progress: Object
  },
  data() {
    return {
      newTodo: {},
      valid: false,
      taskRules: [v => !!v || "Task is required"]
    };
  },
  methods: {
    createTodo() {
      var vm = this;
      vm.progress.visible = true;
      axios
        .post("/api/todos", vm.newTodo)
        .then(res => {
          vm.valid = false;
          vm.complete(res.data);
          vm.progress.visible = false;
          vm.newTodo = {};
        })
        .catch(err => {
          vm.progress.visilbe = false;
          vm.complete();
          window.alert("Something went terribly wrong!");
        });
    }
  }
};
</script>
