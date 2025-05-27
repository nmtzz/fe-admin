<script setup>
import {watch} from 'vue';
import {useRoute} from 'vue-router';

const route = useRoute();

watch(() => route.name, (newName) => {
  document.title = newName || 'Dashboard';
}, {immediate: true});
</script>

<template>
  <router-view/>
</template>

<style>
* {
  box-sizing: border-box;
}

body {
  font-family: var(--va-font-family);
  color: #34495e;
  background-color: #f5f7fa;
  margin: 0;
  padding: 0;
}
</style>
