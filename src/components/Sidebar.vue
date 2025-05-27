<script setup>
import {computed} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import router from '../router';
import {getLoggedInUser} from "@/services/authService.js";

const vueRouter = useRouter();
const route = useRoute();

const props = defineProps({
  isCollapsed: {
    type: Boolean,
    default: false
  },
  isMobileHidden: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['toggle-collapse']);
const loggedInUser = getLoggedInUser();
const isAdmin = computed(() => {
  return loggedInUser?.role === 'ADMIN';
});

const menuItems = computed(() => {

  const routes = router.getRoutes();

  const dashboardLayout = routes.find(route =>
      route.path === '/' && route.children && route.children.length > 0
  );

  if (dashboardLayout && dashboardLayout.children) {
    return dashboardLayout.children
        .filter(route => route.meta && route.meta.icon)
        .filter(route => {

          if (route.meta.requiresAdmin && !isAdmin.value) {
            return false;
          }
          return true;
        })
        .map(route => {

          const path = route.path.startsWith('/') ? route.path : `/${route.path}`;

          return {
            title: route.name,
            icon: route.meta.icon,
            path: path
          };
        });
  }

  return [];
});

const isActive = (path) => {

  if (path === '/dashboard') {

    return route.path === path;
  }

  const isActive = route.path.startsWith(path);
  return isActive;
};

const navigateTo = (path) => {
  vueRouter.push(path);
  if (window.innerWidth < 768) {
    emit('toggle-collapse');
  }
};

const toggleCollapse = () => {
  emit('toggle-collapse');
};

const sidebarClasses = computed(() => {
  return {
    'sidebar-collapsed': props.isCollapsed,
    'sidebar-expanded': !props.isCollapsed,
    'sidebar-mobile-hidden': props.isMobileHidden
  };
});
</script>

<template>
  <div class="sidebar bg-gray-800 text-white" :class="sidebarClasses">
    <div class="sidebar-content">
      <div class="sidebar-header p-4 flex items-center"
           :class="{ 'justify-between': !isCollapsed, 'justify-center': isCollapsed }">
        <h2 class="text-xl font-bold text-white" v-if="!isCollapsed">Admin</h2>
        <va-button icon="chevron_left" flat color="#fff" class="collapse-btn" :class="{ 'rotate-180': isCollapsed }"
                   @click="toggleCollapse"/>
      </div>

      <div class="sidebar-menu py-2">
        <div class="menu-items">
          <div v-for="(item, index) in menuItems" :key="index" class="menu-item" :class="{
            'menu-item-active': isActive(item.path),
            'menu-item-collapsed': isCollapsed
          }" @click="navigateTo(item.path)">
            <div class="icon-container" :class="{ 'icon-centered': isCollapsed }">
              <va-icon :name="item.icon" class="menu-icon"/>
            </div>
            <div class="menu-item-text" v-if="!isCollapsed">
              {{ item.title }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sidebar {
  position: fixed;
  top: 64px;

  left: 0;
  bottom: 0;
  transition: all 0.3s ease;
  z-index: 90;
  overflow-y: auto;
  overflow-x: hidden;
  background-color: #1e293b;

}

.sidebar-expanded {
  width: 250px;
}

.sidebar-collapsed {
  width: 70px;
}

.collapse-btn {
  transition: transform 0.3s ease;
}

.sidebar-header {
  height: 60px;
}

.menu-items {
  display: flex;
  flex-direction: column;
  padding: 0 8px;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 16px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
}

.menu-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.menu-item-active {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
}

.menu-item-text {
  margin-left: 12px;
  white-space: nowrap;
}

.icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.menu-icon {
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-centered {
  margin: 0 auto;
  width: 100%;
  text-align: center;
}

.menu-item-collapsed {
  justify-content: center;
  padding: 12px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.menu-item-collapsed .icon-container {
  width: 100%;
  height: 24px;
}

.menu-item-collapsed .menu-icon {
  font-size: 24px;
}

@media (max-width: 768px) {
  .sidebar-mobile-hidden {
    transform: translateX(-100%);
  }

  .sidebar {
    width: 80%;
    max-width: 300px;
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
  }

  .menu-item {
    padding: 15px 16px;
    margin-bottom: 10px;
  }

  .icon-container {
    width: 28px;
    height: 28px;
  }
}
</style>
