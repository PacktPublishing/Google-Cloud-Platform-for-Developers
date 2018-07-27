<template>
  <v-content>
    <v-card class="mx-auto pa-2" style="max-width: 600px;" v-if="items.length">
        <v-list three-lines>
          <template v-for="(item, index) in sortItems(items)">
            <v-list-tile
              :key="item.task"
              avatar class="pa-1"
              v-bind:class="{'green lighten-4': item.complete}"
            >
              <v-list-tile-action>
                <v-icon color="primary">{{ item.complete ? 'check' : 'label' }}</v-icon>
              </v-list-tile-action>

              <v-list-tile-content>
                <v-list-tile-title>{{item.task}}</v-list-tile-title>
                <v-list-tile-sub-title>{{item.notes}}</v-list-tile-sub-title>
                <v-list-tile-sub-title>
                  <small>{{formatTodoDate(item.dateCreated)}}</small>
                </v-list-tile-sub-title>
              </v-list-tile-content>


              <v-list-tile-action v-if="!item.complete">
                <v-btn
                  :loading="item.completing"
                  flat icon color="success"
                  @click.native="completeTodo(item)"
                >
                  <v-icon dark>check</v-icon>
                </v-btn>
              </v-list-tile-action>

              <v-list-tile-action>
                <v-btn
                  :loading="item.deleting"
                  flat icon color="error"
                  @click.native="deleteTodo(item, index)"
                >
                  <v-icon dark>delete</v-icon>
                </v-btn>
              </v-list-tile-action>
            </v-list-tile>


          </template>
        </v-list>
    </v-card>

    <v-alert :value="items.length == 0" type="success" style="max-width: 500px;">
      All caught up! Click <b>+</b> to create a new Todo.
    </v-alert>

    <v-alert :value="error" type="error" transition="fade-transition"
        style="max-width: 500px; margin-top: 30px;">
      {{error}}
    </v-alert>

  </v-content>
</template>

<script>
import moment from "moment";
import { sortBy } from "lodash";
import axios from "axios";

export default {
  name: "TodoList",
  props: {
    items: Array,
    change: Function,
    progress: Object
  },
  data() {
    return {
      error: null
    };
  },
  methods: {
    sortItems(items) {
      return sortBy(items, [o => o.complete, o => o.dateCreated]);
    },
    formatTodoDate(date) {
      return moment(date).fromNow();
    },
    completeTodo(todo) {
      var vm = this;
      vm.progress.visible = true;
      axios
        .put(`/api/todos/${todo.id}`, todo)
        .then(res => {
          todo.complete = true;
          vm.progress.visible = false;
        })
        .catch(vm.notifyError);
    },
    deleteTodo(todo) {
      var vm = this;
      vm.progress.visible = true;
      axios
        .delete(`/api/todos/${todo.id}`)
        .then(() => {
          vm.change(todo);
        })
        .catch(vm.notifyError);
    },
    notifyError(err) {
      var vm = this;
      vm.progress.visible = false;
      vm.error = err.message;
      setTimeout(() => {
        vm.error = null;
      }, 2000);
    }
  }
};
</script>
