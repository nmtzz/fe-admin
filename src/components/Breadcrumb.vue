<script setup>
import {computed} from 'vue';
import {useRoute} from 'vue-router';

const route = useRoute();

const breadcrumbItems = computed(() => {

  const items = [
    {title: 'Home', path: '/dashboard'}
  ];

  const matchedRoutes = route.matched;

  const relevantRoutes = matchedRoutes.filter(matchedRoute =>
      matchedRoute.path !== '/' && matchedRoute.name !== 'Home' && matchedRoute.name !== 'Dashboard' && !matchedRoute.name.includes('List')
  );

  relevantRoutes.forEach((matchedRoute, index) => {

    let fullPath = '';

    if (matchedRoute.path.includes('/')) {

      fullPath = matchedRoute.path;
    } else if (index > 0) {

      const parentPath = relevantRoutes[index - 1].path;
      fullPath = `${parentPath}/${matchedRoute.path}`;
    } else {

      fullPath = `/${matchedRoute.path}`;
    }

    items.push({
      title: matchedRoute.name,
      path: fullPath
    });
  });

  return items;
});
</script>

<template>
  <div class="breadcrumb-container p-3 sm:p-4">
    <va-breadcrumbs>
      <va-breadcrumbs-item v-for="(item, index) in breadcrumbItems" :key="index" :label="item.title" :to="item.path"
                           :disabled="index === breadcrumbItems.length - 1"/>
    </va-breadcrumbs>
  </div>
</template>

<style scoped>
.breadcrumb-container {
  background-color: white;
  border-bottom: 1px solid #eee;
  width: 100%;
  overflow-x: auto;
}

:deep(.va-breadcrumbs) {
  white-space: nowrap;
  overflow-x: auto;
  padding: 0 4px;
}

@media (max-width: 640px) {
  .breadcrumb-container {
    padding: 10px;
  }
}
</style>
