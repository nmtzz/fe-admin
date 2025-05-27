<script setup>
import {getLoggedInUser, logout} from '@/services/authService';
import {computed, onMounted, onUnmounted, ref} from 'vue';

const windowWidth = ref(window.innerWidth);
const emit = defineEmits(['toggle-mobile-menu']);
const updateWindowWidth = () => {
  windowWidth.value = window.innerWidth;
};

onMounted(() => {
  window.addEventListener('resize', updateWindowWidth);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateWindowWidth);
});

const isMobileView = computed(() => {
  return windowWidth.value < 768;
});

const toggleMobileMenu = () => {
  emit('toggle-mobile-menu', true);
};

const loggedInUser = getLoggedInUser();

</script>

<template>
  <va-navbar class="dashboard-navbar" color="primary">
    <template #left>
      <div class="navbar-section">
        <va-button
            v-if="isMobileView"
            icon="menu"
            color="primary"
            class="navbar-btn md:hidden"
            text-color="#fff"
            @click="toggleMobileMenu"
        />

        <div class="flex items-center brand-container">
          <div class="logo-wrapper rounded-full bg-white flex items-center justify-center p-1 mr-3">
            <va-icon name="dashboard" size="small" color="primary" class="brand-icon"/>
          </div>
          <span class="text-lg font-bold brand-text">GadgetifyAdmin</span>
        </div>
      </div>
    </template>

    <template #center>
      <div class="navbar-section">
        <div class="search-container">
          <va-input
              class="search-input"
              placeholder="Search..."
              icon="search"
              rounded
              bordered
              background-color="rgba(255, 255, 255, 0.15)"
              text-color="#fff"
          />
        </div>
      </div>
    </template>

    <template #right>
      <div class="navbar-section navbar-right">

        <va-dropdown :offset="[0, 10]">
          <template #anchor>
            <div class="user-profile-btn">
              <div class="user-avatar">
                {{ loggedInUser?.fullName?.[0] || 'U' }}
              </div>
              <span class="user-name hidden sm:block">{{ loggedInUser?.fullName }}</span>
              <va-icon name="expand_more" size="small" class="hidden sm:block"/>
            </div>
          </template>

          <va-dropdown-content class="user-dropdown">
            <div class="user-dropdown-header">
              <div class="user-avatar-large">
                {{ loggedInUser?.fullName?.[0] || 'U' }}
              </div>
              <div class="user-info">
                <h4 class="user-name-large">{{ loggedInUser?.fullName }}</h4>
                <p class="user-role">{{ loggedInUser?.email }}</p>
              </div>
            </div>

            <div class="user-dropdown-divider"></div>

            <div class="user-dropdown-menu">
              <a @click="$router.push('/account')" class="user-dropdown-item">
                <va-icon name="person" size="small"/>
                <span>Account</span>
              </a>
              <div class="user-dropdown-divider"></div>
              <a @click="logout" class="user-dropdown-item text-danger">
                <va-icon name="logout" size="small"/>
                <span>Logout</span>
              </a>
            </div>
          </va-dropdown-content>
        </va-dropdown>
      </div>
    </template>
  </va-navbar>
</template>

<style scoped>
.dashboard-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.navbar-section {
  display: flex;
  align-items: center;
  height: 100%;
}

.navbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  width: 40px;
  margin: 0 8px;
  position: relative;
}

.notification-badge {
  position: absolute;
  top: 5px;
  right: 5px;
  font-size: 10px;
  height: 16px;
  min-width: 16px;
  padding: 0 4px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.va-navbar__left),
:deep(.va-navbar__center),
:deep(.va-navbar__right) {
  height: 100%;
  display: flex;
  align-items: center;
}

:deep(.va-navbar__center),
:deep(.va-navbar__right) {
  padding: 0 8px;
}

:deep(.va-navbar__left) {
  flex: 0 0 auto;
  min-width: 200px;
}

:deep(.va-navbar__center) {
  flex: 1;
  justify-content: center;
  padding: 0 16px;
}

:deep(.va-navbar__right) {
  flex: 0 0 auto;
  justify-content: flex-end;
  min-width: 220px;
}

:deep(.va-input-wrapper) {
  margin-bottom: 0;
  width: 100%;
}

.search-container {
  display: flex;
  align-items: center;
  height: 40px;
  width: 100%;
  max-width: 400px;
  justify-content: center;
}

.search-input {
  width: 100%;
  display: flex;
}

.search-input :deep(input::placeholder) {
  color: rgba(255, 255, 255, 0.8);
}

.brand-container {
  display: flex;
  align-items: center;
  height: 100%;
  padding-left: 16px;
}

.brand-text {
  white-space: nowrap;
  line-height: 1;
  letter-spacing: 0.5px;
}

.logo-wrapper {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-right: 16px;
}

.user-profile-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  border-radius: 24px;
  cursor: pointer;
  transition: background-color 0.2s;
  height: 40px;
}

.user-profile-btn:hover {
  background-color: rgba(255, 255, 255, 0.15);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: white;
  color: var(--va-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
}

.user-name {
  color: white;
  font-weight: 500;
  max-width: 130px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-dropdown {
  min-width: 260px;
  padding: 0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.user-dropdown-header {
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: rgba(var(--va-primary-rgb), 0.05);
}

.user-avatar-large {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: var(--va-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 20px;
}

.user-info {
  flex: 1;
}

.user-name-large {
  font-weight: 600;
  font-size: 16px;
  margin: 0;
  line-height: 1.2;
}

.user-role {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.user-dropdown-divider {
  height: 1px;
  background-color: #eee;
  margin: 0;
}

.user-dropdown-menu {
  padding: 8px;
}

.user-dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  color: #333;
  text-decoration: none;
}

.user-dropdown-item:hover {
  background-color: rgba(var(--va-primary-rgb), 0.05);
}

.text-danger {
  color: var(--va-danger);
}

.notification-dropdown {
  width: 320px;
  padding: 0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.notification-header {
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #eee;
}

.notification-list {
  max-height: 320px;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  padding: 12px 16px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: background-color 0.2s;
}

.notification-item:hover {
  background-color: #f9f9f9;
}

.notification-item.unread {
  background-color: rgba(var(--va-primary-rgb), 0.05);
}

.notification-icon {
  position: relative;
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-dot {
  position: absolute;
  top: 0;
  right: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--va-danger);
}

.notification-content {
  flex: 1;
}

.notification-text {
  margin: 0 0 4px;
  font-size: 14px;
  line-height: 1.3;
}

.notification-time {
  font-size: 12px;
  color: #888;
}

.notification-footer {
  padding: 8px;
  border-top: 1px solid #eee;
}

.empty-notifications {
  padding: 32px 16px;
  text-align: center;
  color: #888;
}

@media (max-width: 768px) {
  :deep(.va-navbar__left) {
    min-width: 60px;
  }

  :deep(.va-navbar__right) {
    min-width: 120px;
  }

  .search-container {
    max-width: 250px;
  }

  .brand-container {
    padding-left: 8px;
  }

  .brand-text {
    font-size: 14px;
  }
}

@media (max-width: 640px) {
  .dashboard-navbar {
    padding: 0;
  }

  :deep(.va-navbar__left),
  :deep(.va-navbar__center),
  :deep(.va-navbar__right) {
    padding: 0 4px;
  }

  :deep(.va-navbar__left) {
    min-width: 50px;
    padding-left: 8px;
  }

  :deep(.va-navbar__center) {
    flex: 1;
    padding: 0 8px;
  }

  :deep(.va-navbar__right) {
    min-width: 100px;
  }

  .navbar-btn {
    margin: 0 4px;
  }

  .search-container {
    max-width: 100%;
    padding: 0;
  }

  .navbar-right {
    padding-right: 8px;
  }

  :deep(.va-input__container) {
    width: 100%;
  }

  .notification-dropdown {
    width: 280px;
  }
}
</style>
