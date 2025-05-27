<script setup>
import {computed, onMounted, onUnmounted, ref} from 'vue';
import Navbar from './Navbar.vue';
import Sidebar from './Sidebar.vue';
import Breadcrumb from './Breadcrumb.vue';
import ContentSection from './ContentSection.vue';

const windowWidth = ref(window.innerWidth);
const isSidebarCollapsed = ref(false);
const isSidebarMobileHidden = ref(true);

const updateWindowWidth = () => {
  windowWidth.value = window.innerWidth;
  if (windowWidth.value < 768 && !isSidebarMobileHidden.value) {
    isSidebarMobileHidden.value = true;
  }
};

onMounted(() => {
  window.addEventListener('resize', updateWindowWidth);

  isSidebarCollapsed.value = windowWidth.value < 1024;
});

onUnmounted(() => {
  window.removeEventListener('resize', updateWindowWidth);
});

const isMobileView = computed(() => {
  return windowWidth.value < 768;
});

const toggleSidebar = () => {
  if (isMobileView.value) {
    isSidebarMobileHidden.value = !isSidebarMobileHidden.value;
  } else {
    isSidebarCollapsed.value = !isSidebarCollapsed.value;
  }
};

const toggleMobileMenu = (isOpen) => {
  isSidebarMobileHidden.value = !isOpen;
};

const handleContentClick = () => {
  if (isMobileView.value && !isSidebarMobileHidden.value) {
    isSidebarMobileHidden.value = true;
  }
};

</script>

<template>
  <div class="dashboard-layout">
    <Navbar @toggle-mobile-menu="toggleMobileMenu"/>

    <div v-if="isMobileView && !isSidebarMobileHidden" class="sidebar-overlay" @click="handleContentClick"></div>

    <Sidebar :is-collapsed="isSidebarCollapsed" :is-mobile-hidden="isSidebarMobileHidden"
             @toggle-collapse="toggleSidebar"/>

    <div class="dashboard-main" :class="{
      'sidebar-expanded': !isSidebarCollapsed && !isMobileView,
      'sidebar-collapsed': isSidebarCollapsed && !isMobileView,
      'mobile': isMobileView
    }" @click="handleContentClick">
      <Breadcrumb/>

      <ContentSection>
        <router-view v-slot="{ Component }">
          <keep-alive>
            <component :is="Component"/>
          </keep-alive>
        </router-view>
      </ContentSection>
    </div>
  </div>
</template>

<style scoped>
.dashboard-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.dashboard-main {
  margin-top: 64px;

  transition: margin-left 0.3s ease;
  width: 100%;
}

.dashboard-main.sidebar-expanded {
  margin-left: 250px;

  width: calc(100% - 250px);
}

.dashboard-main.sidebar-collapsed {
  margin-left: 70px;

  width: calc(100% - 70px);
}

.dashboard-main.mobile {
  margin-left: 0;
  width: 100%;
}

.sidebar-overlay {
  position: fixed;
  top: 64px;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 80;
  transition: opacity 0.3s ease;
}

@media (max-width: 768px) {
  .dashboard-main {
    margin-left: 0;
    width: 100%;
  }
}
</style>
