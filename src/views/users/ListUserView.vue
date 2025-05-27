<script setup>
import {useMutation, useQuery, useQueryClient} from "@tanstack/vue-query";
import {useForm, useModal, useToast} from 'vuestic-ui';
import axios from "axios";
import {computed, reactive, ref, watch} from 'vue';
import {minLength, requiredField} from "@/utils/validationUtil.js";
import {getLoggedInUser} from "@/services/authService.js";

const queryClient = useQueryClient();
const {notify} = useToast();
const {confirm} = useModal();

const searchQuery = ref('');
const statusFilter = ref('all');
const roleFilter = ref('all');

const currentPage = ref(1);
const itemsPerPage = ref(10);

const resetPasswordModal = ref(false);
const selectedUser = ref(null);
const passwordForm = reactive({
  password: '',
  confirmPassword: ''
});
const passwordErrors = ref({});
const {isValid, validate} = useForm('passwordResetForm');

const addUserModal = ref(false);
const addUserForm = reactive({
  email: '',
  password: '',
  confirmPassword: '',
  fullName: '',
  role: 'STAFF',
  status: true
});
const {isValid: isAddUserFormValid, validate: validateAddUserForm} = useForm('addUserFormRef');

const loggedInUser = getLoggedInUser();
const {data: users, isLoading, isError} = useQuery({
  queryKey: ['users'],
  queryFn: async () => {
    const {data} = await axios.get('/users')
    return data?.result?.filter(user => user.id !== loggedInUser.id)
  }
});

const toggleStatusMutation = useMutation({
  mutationFn: async (userId) => {
    return await axios.patch(`/users/change-status/${userId}`)
  },
  onSuccess: () => {
    notify({
      message: 'User status updated successfully',
      color: 'success'
    });
    queryClient.invalidateQueries({queryKey: ['users']});
  },
  onError: (error) => {
    notify({
      message: `Failed to update user status: ${error.message}`,
      color: 'danger'
    });
  }
});

const resetPasswordMutation = useMutation({
  mutationFn: async ({userId, password}) => {
    return await axios.patch(`/users/reset-password/${userId}`, null, {
      params: {password}
    });
  },
  onSuccess: () => {
    notify({
      message: 'Password has been reset successfully',
      color: 'success'
    });
    resetPasswordModal.value = false;
    clearPasswordForm();
  },
  onError: (error) => {
    notify({
      message: `Failed to reset password: ${error.message}`,
      color: 'danger'
    });
  }
});

const roleOptions = [
  {text: 'All Roles', value: 'all'},
  {text: 'Admin', value: 'ADMIN'},
  {text: 'Staff', value: 'STAFF'},
  {text: 'Customer', value: 'CUSTOMER'}
];

const statusOptions = [
  {text: 'All Status', value: 'all'},
  {text: 'Active', value: true},
  {text: 'Inactive', value: false}
];

const columns = [
  {
    key: 'id',
    title: 'ID',
    sortable: true,
    width: '80px'
  },
  {
    key: 'fullName',
    title: 'Full Name',
    sortable: true
  },
  {
    key: 'email',
    title: 'Email',
    sortable: true
  },
  {
    key: 'role',
    title: 'Role',
    sortable: true
  },
  {
    key: 'status',
    title: 'Status',
    sortable: true
  },
  {
    key: 'actions',
    title: 'Actions',
    sortable: false
  }
];

const filteredUsers = computed(() => {
  if (!users.value) return [];

  return users.value.filter(user => {

    const searchLower = searchQuery.value.toLowerCase();
    const matchesSearch = searchQuery.value === '' ||
        user.fullName?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.id?.toString().includes(searchLower);

    const matchesStatus = statusFilter.value === 'all' || user.status === statusFilter.value;

    const matchesRole = roleFilter.value === 'all' || user.role === roleFilter.value;

    return matchesSearch && matchesStatus && matchesRole;
  });
});

const paginatedUsers = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage.value;
  const endIndex = startIndex + itemsPerPage.value;
  return filteredUsers.value.slice(startIndex, endIndex);
});

const totalPages = computed(() => {
  return Math.ceil(filteredUsers.value.length / itemsPerPage.value);
});

watch([searchQuery, statusFilter, roleFilter], () => {
  currentPage.value = 1;
});

const handleToggleStatus = (user) => {
  confirm({
    message: `Are you sure you want to ${user.status ? 'deactivate' : 'activate'} user "${user.fullName}"?`,
    title: `${user.status ? 'Deactivate' : 'Activate'} User`,
    okText: 'Yes, Proceed',
    cancelText: 'Cancel',
    color: user.status ? 'warning' : 'success'
  }).then((confirmed) => {
    if (!confirmed) return;
    toggleStatusMutation.mutate(user.id);
  });
};
const newUser = ref({
  email: '',
  password: '',
  fullName: '',
  role: 'STAFF',
  status: true
})
const addUser = useMutation({
  mutationFn: async (user) => {
    return await axios.post('/users/register', user)
  },
  onSuccess: () => {
    queryClient.invalidateQueries({queryKey: ['users']})
    notify({
      message: 'User added successfully',
      color: 'success',
    })
  },
  onError: () => {
    notify({
      message: 'Failed to add user',
      color: 'danger',
    })
  }
})

const resetFilters = () => {
  searchQuery.value = '';
  statusFilter.value = 'all';
  roleFilter.value = 'all';
  currentPage.value = 1;
};

const resetUserPassword = (user) => {
  selectedUser.value = user;
  resetPasswordModal.value = true;
  clearPasswordForm();
};

const clearPasswordForm = () => {
  passwordForm.password = '';
  passwordForm.confirmPassword = '';
  passwordErrors.value = {};
};

const submitPasswordReset = () => {
  validate();
  if (isValid.value) {
    resetPasswordMutation.mutate({
      userId: selectedUser.value.id,
      password: passwordForm.password
    });
  }
};

const openAddUserModal = () => {
  addUserModal.value = true;
  clearAddUserForm();
};

const clearAddUserForm = () => {
  addUserForm.email = '';
  addUserForm.password = '';
  addUserForm.confirmPassword = '';
  addUserForm.fullName = '';
  addUserForm.role = 'STAFF';
  addUserForm.status = true;
};

const submitAddUser = () => {
  validateAddUserForm();

  if (isAddUserFormValid.value) {

    const userData = {
      email: addUserForm.email,
      password: addUserForm.password,
      fullName: addUserForm.fullName,
      role: addUserForm.role,
      status: addUserForm.status
    };

    addUser.mutate(userData, {
      onSuccess: () => {
        addUserModal.value = false;
      }
    });
  }
};
</script>

<template>
  <div class="users-list-page">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-800">Users</h1>
      <va-button
          color="primary"
          icon="person_add"
          @click="openAddUserModal"
      >
        Add User
      </va-button>
    </div>

    <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
      <div class="flex flex-wrap gap-4 items-end">

        <div class="search-container flex-grow">
          <label class="block text-sm font-medium text-gray-600 mb-1">Search</label>
          <va-input
              v-model="searchQuery"
              placeholder="Search by name, email or ID"
              class="search-input"
          >
            <template #appendInner>
              <va-icon name="search"/>
            </template>
          </va-input>
        </div>

        <div class="role-filter">
          <label class="block text-sm font-medium text-gray-600 mb-1">Role</label>
          <va-select
              v-model="roleFilter"
              :options="roleOptions"
              text-by="text"
              value-by="value"
              class="filter-select"
          />
        </div>

        <div class="status-filter">
          <label class="block text-sm font-medium text-gray-600 mb-1">Status</label>
          <va-select
              v-model="statusFilter"
              :options="statusOptions"
              text-by="text"
              value-by="value"
              class="filter-select"
          />
        </div>

        <div class="ml-auto">
          <va-button
              icon="restart_alt"
              color="secondary"
              flat
              @click="resetFilters"
          >
            Reset Filters
          </va-button>
        </div>
      </div>
    </div>

    <div class="bg-white p-6 rounded-lg shadow-sm">

      <div v-if="isLoading" class="loading-container flex items-center justify-center">
        <va-inner-loading loading color="primary">
          <va-icon name="hourglass_empty" size="large"/>
        </va-inner-loading>
      </div>

      <div v-else-if="isError" class="error-container py-16 flex flex-col items-center justify-center">
        <va-icon name="error_outline" size="large" color="danger"/>
        <p class="mt-4 text-gray-600">Failed to load users. Please try again later.</p>
        <va-button class="mt-6" color="primary" @click="$router.go()">
          Retry
        </va-button>
      </div>

      <div v-else-if="filteredUsers.length === 0" class="empty-state py-16 flex flex-col items-center justify-center">
        <va-icon name="person_off" size="large" color="secondary"/>
        <p class="mt-4 text-gray-600">No users found matching your filters.</p>
        <va-button class="mt-6" color="primary" @click="resetFilters">
          Clear Filters
        </va-button>
      </div>

      <div v-else class="users-table-container">
        <va-data-table
            :items="paginatedUsers"
            :columns="columns"
            striped
            hoverable
            class="users-table custom-alignment-table"
        >

          <template #cell(id)="{ rowData }">
            <span class="font-medium">#{{ rowData.id }}</span>
          </template>

          <template #cell(fullName)="{ rowData }">
            <div class="font-medium">{{ rowData.fullName }}</div>
          </template>

          <template #cell(email)="{ rowData }">
            <div>{{ rowData.email }}</div>
          </template>

          <template #cell(role)="{ rowData }">
            <va-badge
                :text="rowData.role"
                :color="rowData.role === 'ADMIN' ? 'warning' : 'info'"
                class="role-badge"
            />
          </template>

          <template #cell(status)="{ rowData }">
            <va-badge
                :text="rowData.status ? 'Active' : 'Inactive'"
                :color="rowData.status ? 'success' : 'danger'"
                class="status-badge"
            />
          </template>

          <template #cell(actions)="{ rowData }">
            <div class="flex gap-2">
              <va-button
                  v-if="rowData.role !== 'ADMIN'"
                  :icon="rowData.status ? 'block' : 'check_circle'"
                  size="small"
                  :color="rowData.status ? 'danger' : 'success'"
                  flat
                  @click="handleToggleStatus(rowData)"
                  :title="rowData.status ? 'Deactivate User' : 'Activate User'"
              />
              <va-button
                  icon="key"
                  size="small"
                  color="warning"
                  flat
                  @click="resetUserPassword(rowData)"
                  title="Reset Password"
              />
            </div>
          </template>
        </va-data-table>

        <div class="pagination-controls flex items-center justify-between p-4 border-t border-gray-200 mt-4">
          <div class="text-sm text-gray-500">
            Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to
            {{ Math.min(currentPage * itemsPerPage, filteredUsers.length) }} of
            {{ filteredUsers.length }} users
          </div>

          <div class="flex items-center">
            <va-pagination
                v-model="currentPage"
                :pages="totalPages"
                :visible-pages="5"
                color="primary"
                boundary-links
                size="small"
            />

            <va-select
                v-model="itemsPerPage"
                :options="[5, 10, 25, 50]"
                class="items-per-page-select ml-4"
                size="small"
            />
          </div>
        </div>
      </div>
    </div>

    <va-modal
        v-model="resetPasswordModal"
        title="Reset User Password"
        size="small"
        hide-default-actions
        :overlay-opacity="0.7"
    >
      <va-form ref="passwordResetForm">
        <div class="p-4">
          <div class="mb-4 text-center">
            <h3 class="text-lg font-medium mb-2">Reset Password for {{ selectedUser?.fullName }}</h3>
            <p class="text-sm text-gray-600">Enter a new password for this user</p>
          </div>

          <div class="mb-4">
            <va-input
                v-model="passwordForm.password"
                label="New Password"
                placeholder="Enter new password"
                :rules="[requiredField('Password'), minLength('Password', 3)]"
                class="w-full"
            />
          </div>

          <div class="mb-4">
            <va-input
                v-model="passwordForm.confirmPassword"
                label="Confirm Password"
                :rules="[requiredField('Confirm Password'), minLength('Confirm Password', 3)]"
                placeholder="Confirm new password"
                class="w-full"
            />
          </div>

          <div class="flex justify-end gap-2 mt-6">
            <va-button
                flat
                @click="resetPasswordModal = false"
            >
              Cancel
            </va-button>
            <va-button
                color="primary"
                @click="submitPasswordReset"
                :loading="resetPasswordMutation.isPending.value"
            >
              Reset Password
            </va-button>
          </div>
        </div>
      </va-form>
    </va-modal>

    <va-modal
        v-model="addUserModal"
        title="Add New User"
        size="medium"
        hide-default-actions
        :overlay-opacity="0.7"
    >
      <va-form ref="addUserFormRef">
        <div class="p-4">
          <div class="mb-4 text-center">
            <h3 class="text-lg font-medium mb-2">Create New User Account</h3>
            <p class="text-sm text-gray-600">Enter user details below</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="mb-4">
              <va-input
                  v-model="addUserForm.email"
                  label="Email"
                  :rules="[requiredField('Email')]"
                  placeholder="Enter email address"
                  class="w-full"
              />
            </div>

            <div class="mb-4">
              <va-input
                  v-model="addUserForm.fullName"
                  label="Full Name"
                  :rules="[requiredField('Full Name')]"
                  placeholder="Enter full name"
                  class="w-full"
              />
            </div>

            <div class="mb-4">
              <va-input
                  v-model="addUserForm.password"
                  label="Password"
                  type="password"
                  :rules="[requiredField('Password'), minLength('Password', 3)]"
                  placeholder="Enter password"
                  class="w-full"
              />
            </div>

            <div class="mb-4">
              <va-input
                  v-model="addUserForm.confirmPassword"
                  label="Confirm Password"
                  type="password"
                  :rules="[
                    requiredField('Confirm Password'),
                    minLength('Confirm Password', 3),
                    value => value === addUserForm.password || 'Passwords do not match'
                  ]"
                  placeholder="Confirm password"
                  class="w-full"
              />
            </div>

            <div class="mb-4">
              <va-select
                  v-model="addUserForm.role"
                  label="Role"
                  :options="[
                    {text: 'Admin', value: 'ADMIN'},
                    {text: 'Staff', value: 'STAFF'},
                    {text: 'Customer', value: 'CUSTOMER'}
                  ]"
                  text-by="text"
                  value-by="value"
                  class="w-full"
              />
            </div>

            <div class="mb-4 flex items-center mt-6">
              <va-checkbox
                  v-model="addUserForm.status"
                  label="Active account"
              />
            </div>
          </div>

          <div class="flex justify-end gap-2 mt-6">
            <va-button
                flat
                @click="addUserModal = false"
            >
              Cancel
            </va-button>
            <va-button
                color="primary"
                @click="submitAddUser"
                :loading="addUser.isPending.value"
            >
              Create User
            </va-button>
          </div>
        </div>
      </va-form>
    </va-modal>
  </div>
</template>

<style scoped>
.users-list-page {
  animation: fadeIn 0.3s ease-in-out;
}

.role-badge,
.status-badge {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.25rem 0.5rem;
}

.loading-container,
.error-container,
.empty-state {
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-container {
  min-width: 250px;
}

.filter-select {
  min-width: 200px;
}

.items-per-page-select {
  width: 70px;
}

:deep(.va-data-table__thead th) {
  text-align: left;
  cursor: pointer;
}

:deep(.va-data-table__thead th:hover) {
  background-color: rgba(0, 0, 0, 0.03);
}

:deep(.va-data-table__tbody td) {
  text-align: left;
}

:deep(.va-data-table__cell) {
  justify-content: flex-start;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 640px) {
  .search-container,
  .role-filter,
  .status-filter {
    width: 100%;
  }

  .search-input,
  .filter-select {
    width: 100%;
  }

  .pagination-controls {
    flex-direction: column;
    gap: 1rem;
  }

  .pagination-controls > div {
    width: 100%;
    display: flex;
    justify-content: center;
  }
}
</style>
