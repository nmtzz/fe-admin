<script setup>
</script>

<template>
  <div class="content-section p-6 pt-3 pl-5">
    <slot></slot>
  </div>
</template>

<style scoped>
.content-section {
  background-color: #f5f7fa;
  min-height: calc(100vh - 64px - 56px);

  width: 100%;
  overflow-x: hidden;
}

@media (max-width: 640px) {
  .content-section {
    padding: 12px;
  }
}
</style>
