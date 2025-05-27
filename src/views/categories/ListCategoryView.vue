<script setup>
import {useMutation, useQuery, useQueryClient} from '@tanstack/vue-query';
import {useModal, useToast} from 'vuestic-ui'
import axios from 'axios';
import {useRouter} from 'vue-router';
import {computed, ref} from 'vue';

const queryClient = useQueryClient()
const router = useRouter();
const searchQuery = ref('');
const statusFilter = ref('all');
const {notify} = useToast()
const {confirm} = useModal()
const {data: categories, isPending: isCategoriesLoading, isError: isCategoriesError} = useQuery({
  queryKey: ['categories'],
  queryFn: async () => {
    const {data} = await axios.get('/categories')
    return data
  }
})
const mutation = useMutation({
  mutationFn: async (categoryId) => {
    return await axios.patch(`/categories/soft-delete/${categoryId}`)
  },
  onSuccess: () => {
    queryClient.invalidateQueries()
    notify({
      message: 'Category deactivated successfully',
      color: 'success',
    })
  },
  onError: () => {
    notify({
      message: 'Failed to deactivate category',
      color: 'danger',
    })
  }
})

const columns = [
  {
    key: 'id',
    label: 'ID',
    sortable: true,
  },
  {
    key: 'name',
    label: 'Name',
    sortable: true,
  },
  {
    key: 'status',
    label: 'Status',
  },
  {
    key: "actions",
    label: 'Actions',
    width: '80px',
  },
]

const goToAddCategory = () => {
  router.push('/categories/add');
}
const prefetchOnMouseOver = (categoryId) => {
  if (queryClient.getQueryData([`categories/${categoryId}`])) return;
  queryClient.prefetchQuery({
    queryKey: [`categories/${categoryId}`],
    queryFn: async () => {
      const {data} = await axios.get(`/categories/${categoryId}`)
      console.log(data)
      return data
    }
  })
}

const goToEditCategory = async (categoryId) => {
  await router.push(`/categories/${categoryId}`);
}

const handleDeleteCategory = (categoryId) => {
  confirm({
    title: 'Deactivate Category',
    message: 'Are you sure you want to deactivate this category?',
    okText: 'Deactivate',
    cancelText: 'Cancel',
    child: {
      okButton: {
        color: 'danger'
      }
    }
  }).then((confirmed) => {
    if (confirmed) {
      mutation.mutate(categoryId)
    }
  })
}

const filteredCategories = computed(() => {
  if (!categories.value || !categories.value.result) return [];

  if (statusFilter.value === 'all') {
    return categories.value.result;
  }

  const isActive = statusFilter.value === true;
  return categories.value.result.filter(category => category.status === isActive);
});
</script>
<template>
  <div class="categories-page">

    <div class="page-header mb-6 flex flex-wrap items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Categories</h1>
        <p class="text-gray-600 mt-2">Manage your product categories</p>
      </div>
      <div class="mt-4 sm:mt-0">
        <va-button color="#4318FF" gradient icon="add" class="add-button" @click="goToAddCategory">
          Add Category
        </va-button>
      </div>
    </div>

    <div class="bg-white p-6 rounded-lg shadow-sm">

      <div class="flex flex-wrap items-center justify-between mb-6">
        <div class="search-container w-full md:w-auto mb-4 md:mb-0">
          <va-input v-model="searchQuery" placeholder="Search categories..." icon="search"
                    class="search-input"/>
        </div>
        <div class="filter-container w-full md:w-auto">
          <va-select v-model="statusFilter" placeholder="Filter by status" textBy="text" valueBy="value"
                     :options="[
                            { text: 'Filter by status', value: 'all' },
                            { text: 'Active', value: true },
                            { text: 'Inactive', value: false }
                        ]" color="primary" class="status-filter"/>
        </div>
      </div>

      <div class="table-container">
        <div v-if="isCategoriesError" class="error-container py-16 flex flex-col items-center justify-center">
          <va-icon name="error_outline" size="large" color="danger"/>
          <p class="mt-4 text-gray-600">Failed to load categories. Please try again later.</p>
          <va-button class="mt-6" color="primary" @click="$router.go()">
            Retry
          </va-button>
        </div>

        <div v-else>
          <va-data-table :loading="isCategoriesLoading" :items="filteredCategories" :columns="columns"
                         :filter="searchQuery" striped hoverable class="categories-table">

            <template #cell(name)="{ rowData }">
              <div class="font-medium">{{ rowData.name }}</div>
            </template>

            <template #cell(status)="{ rowData }">
              <VaBadge :text="rowData.status ? 'Active' : 'Inactive'"
                       :color="rowData.status ? 'primary' : 'danger'" :class="['status-badge']"/>
            </template>

            <template #cell(actions)="{ rowData }">
              <div class="flex items-center justify-center">
                <VaPopover @mouseover="prefetchOnMouseOver(rowData.id)" placement="left"
                           :message="`Edit Category ${rowData.id}`" color="primary">
                  <div>
                    <va-button class="mr-2" icon="edit" size="small" color="info"
                               @click="goToEditCategory(rowData.id)"/>
                  </div>
                </VaPopover>
                <VaPopover placement="left" :message="`Deactivate Category ${rowData.id}`"
                           color="danger">
                  <div>
                    <va-button v-if="rowData.status" icon="pause" size="small" color="danger"
                               @click="handleDeleteCategory(rowData.id)"/>
                  </div>
                </VaPopover>
              </div>
            </template>

            <template #bodyAppend v-if="filteredCategories.length === 0">
              <tr>
                <td colspan="4" class="text-center py-8">
                  <va-icon name="category" size="large" class="mb-2 text-gray-400"/>
                  <p class="text-gray-600">No categories found</p>
                  <va-button v-if="statusFilter !== 'all' && categories.result.length > 0"
                             class="mt-4 mr-2" color="info" @click="statusFilter = 'all'">
                    Clear Filters
                  </va-button>
                  <va-button class="mt-4" color="primary" @click="goToAddCategory">
                    Add Category
                  </va-button>
                </td>
              </tr>
            </template>
          </va-data-table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.categories-page {
  animation: fadeIn 0.3s ease-in-out;
}

.search-input {
  min-width: 250px;
}

.status-filter {
  min-width: 180px;
}

.categories-table {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
}

.status-badge {
  min-width: 80px;
  min-height: 24px;
  font-weight: 500;
  --va-badge-font-size: 0.875rem;
  --va-badge-text-px: 0.5rem;
  --va-badge-text-py: 0.125rem;
}

.loading-container,
.error-container {
  min-height: 300px;
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
  .filter-container {
    width: 100%;
  }

  .search-input,
  .status-filter {
    width: 100%;
  }

  .add-button {
    width: 100%;
  }
}
</style>
