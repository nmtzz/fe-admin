<script setup>
import {useMutation, useQuery, useQueryClient} from '@tanstack/vue-query';
import {useModal, useToast} from 'vuestic-ui'
import axios from 'axios';
import {useRouter} from 'vue-router';
import {computed, ref, watch} from 'vue';

const queryClient = useQueryClient()
const router = useRouter();
const searchQuery = ref('');
const statusFilter = ref('all');
const categoryFilter = ref('all');
const {notify} = useToast()
const {confirm} = useModal()

const minPrice = ref('');
const maxPrice = ref('');
const showPriceFilter = ref(false);

const currentPage = ref(1)
const itemsPerPage = ref(10)
const itemsPerPageOptions = [5, 10, 20, 50]

const {data: products, isPending: isProductsLoading, isError: isProductsError} = useQuery({
  queryKey: ['products'],
  queryFn: async () => {
    const {data} = await axios.get('/products')
    return data
  }
})

const {data: categories, isPending: isCategoriesLoading} = useQuery({
  queryKey: ['categories'],
  queryFn: async () => {
    const {data} = await axios.get('/categories')
    return data
  }
})

const categoryOptions = computed(() => {
  if (!categories?.value?.result) return [{text: 'All Categories', value: 'all'}];

  const options = [{text: 'All Categories', value: 'all'}];

  categories.value.result
      .forEach(category => {
        options.push({
          text: category.name,
          value: category.id.toString()
        });
      });

  return options;
});

const deactivateMutation = useMutation({
  mutationFn: async (productId) => {
    return await axios.patch(`/products/soft-delete/${productId}`)
  },
  onSuccess: () => {
    queryClient.invalidateQueries()
    notify({
      message: 'Product deactivated successfully',
      color: 'success',
    })
  },
  onError: (error) => {
    notify({
      message: 'Failed to deactivate product',
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
    key: 'productInfo',
    label: 'Product',
    sortable: true,
  },
  {
    key: 'categoryName',
    label: 'Category',
    sortable: true,
  },
  {
    key: 'priceInfo',
    label: 'Price',
    sortable: true,
  },
  {
    key: 'sold',
    label: 'Sold',
    sortable: true,
  },
  {
    key: 'stock',
    label: 'Stock',
    sortable: true,
  },
  {
    key: 'status',
    label: 'Status',
  },
  {
    key: "actions",
    label: 'Actions',
    width: '120px',
  },
]

const goToAddProduct = () => {
  router.push('/products/add');
}

const prefetchOnMouseOver = (productId) => {
  if (queryClient.getQueryData([`products/${productId}`])) return;

  queryClient.prefetchQuery({
    queryKey: [`products/${productId}`],
    queryFn: async () => {
      const {data} = await axios.get(`/products/${productId}`)
      console.log(data?.result)
      return data
    }
  })
}

const goToEditProduct = async (productId) => {
  await router.push(`/products/${productId}`);
}

const handleDeactivateProduct = (productId) => {
  confirm({
    title: 'Deactivate Product',
    message: 'Are you sure you want to deactivate this product? It will no longer be visible to customers.',
    okText: 'Deactivate',
    cancelText: 'Cancel',
    child: {
      okButton: {
        color: 'danger'
      }
    }
  }).then((confirmed) => {
    if (confirmed) {
      deactivateMutation.mutate(productId)
    }
  })
}

const formatCurrency = (value) => {
  if (value == null) return '';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0
  }).format(value);
}

const filteredProducts = computed(() => {
  if (!products?.value?.result) return [];

  let filtered = products.value.result;

  if (searchQuery.value && searchQuery.value.trim() !== '') {
    const query = searchQuery.value.toLowerCase().trim();
    filtered = filtered.filter(product =>
        (product.name && product.name.toLowerCase().includes(query)) ||
        (product.brand && product.brand.toLowerCase().includes(query)) ||
        (product.description && product.description.toLowerCase().includes(query)) ||
        (product.categoryName && product.categoryName.toLowerCase().includes(query))
    );
  }

  if (statusFilter.value !== 'all') {
    const isActive = statusFilter.value === 'active';
    filtered = filtered.filter(product => product.status === isActive);
  }

  if (categoryFilter.value !== 'all') {
    filtered = filtered.filter(product =>
        product.categoryId === parseInt(categoryFilter.value));
  }

  if (minPrice.value) {
    filtered = filtered.filter(product => product.price >= minPrice.value);
  }

  if (maxPrice.value) {
    filtered = filtered.filter(product => product.price <= maxPrice.value);
  }

  return filtered;
});

const resetPriceFilter = () => {
  minPrice.value = '';
  maxPrice.value = '';

  resetPage();
}

const clearAllFilters = () => {
  categoryFilter.value = 'all';
  statusFilter.value = 'all';
  searchQuery.value = '';
  resetPriceFilter();
}

const resetPage = () => {
  currentPage.value = 1;
}

watch([statusFilter, categoryFilter, minPrice, maxPrice, searchQuery], () => {
  resetPage();
}, {deep: true});

const totalItems = computed(() => filteredProducts.value.length)
const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value))

const paginatedProducts = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage.value
  const endIndex = startIndex + itemsPerPage.value

  return filteredProducts.value.slice(startIndex, endIndex).map(product => ({
    ...product,
    productInfo: {
      thumbnail: product.thumbnail,
      name: product.name,
      categoryName: product.categoryName
    },
    priceInfo: {
      price: product.price,
      promotionalPrice: product.promotionPrice,
      hasDiscount: product.discountPercentage > 0
    }
  }))
})

const onPageChange = (page) => {
  currentPage.value = page
}

const onItemsPerPageChange = (value) => {
  itemsPerPage.value = value

  currentPage.value = 1
}

const isProductOutOfStock = (product) => {
  return product.stock <= 0;
}
</script>

<template>
  <div class="products-page">

    <div class="page-header mb-6 flex flex-wrap items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Products</h1>
        <p class="text-gray-600 mt-2">Manage your products</p>
      </div>
      <div class="mt-4 sm:mt-0">
        <va-button color="primary" gradient icon="add" class="add-button" @click="goToAddProduct">
          Add Product
        </va-button>
      </div>
    </div>

    <div class="bg-white p-6 rounded-lg shadow-sm">

      <div class="flex flex-wrap items-center justify-between mb-6">
        <div class="search-container w-full md:w-auto mb-4 md:mb-0">
          <va-input v-model="searchQuery" placeholder="Search products..." icon="search"
                    class="search-input"/>
        </div>
        <div class="filters-container flex flex-wrap gap-3">

          <va-select
              v-model="categoryFilter"
              :options="categoryOptions"
              textBy="text"
              valueBy="value"
              :loading="isCategoriesLoading"
              color="primary"
              class="filter-select"
              placeholder="Filter by category"
          />

          <va-select
              v-model="statusFilter"
              :options="[
                  { text: 'All Products', value: 'all' },
                  { text: 'Active', value: 'active' },
                  { text: 'Inactive', value: 'inactive' }
              ]"
              textBy="text"
              valueBy="value"
              color="primary"
              class="filter-select"
              placeholder="Filter by status"
          />

          <va-button
              icon="attach_money"
              color="primary"
              flat
              class="price-filter-btn"
              @click="showPriceFilter = !showPriceFilter"
          >
            Price Filter
          </va-button>
        </div>
      </div>

      <div v-if="showPriceFilter" class="price-filter-container mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <div class="flex flex-wrap items-end gap-4">
          <div class="price-input-group">
            <label class="block text-sm font-medium text-gray-600 mb-1">Min Price</label>
            <va-input
                v-model="minPrice"
                placeholder="Min price"
                class="price-input">
              <money3
                  v-model.number="minPrice"
                  v-bind="{
                              precision: 0,
                              allowBlank: true
                          }"
              />
            </va-input>
          </div>

          <div class="price-input-group">
            <label class="block text-sm font-medium text-gray-600 mb-1">Max Price</label>
            <va-input
                v-model="maxPrice"
                placeholder="Max price"
                class="price-input"
            >
              <money3
                  v-model.number="maxPrice"
                  v-bind="{
                              precision: 0,
                              allowBlank: true
                          }"
              />
            </va-input>
          </div>

          <div class="price-actions flex gap-2">
            <va-button
                icon="check_circle_outline"
                size="small"
                class="apply-button"
                :style="{ backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb' }"
                @click="resetPage()"
            >
              Apply
            </va-button>

            <va-button
                icon="restart_alt"
                size="small"
                class="reset-button"
                :style="{ backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb' }"
                @click="resetPriceFilter"
            >
              Reset
            </va-button>
          </div>

          <div v-if="minPrice || maxPrice" class="price-filter-summary flex items-center">
            <va-badge color="primary" class="mr-2">
              <template #default>
                    <span v-if="minPrice && maxPrice">
                        {{ formatCurrency(minPrice) }} - {{ formatCurrency(maxPrice) }}
                    </span>
                <span v-else-if="minPrice">
                        Min: {{ formatCurrency(minPrice) }}
                    </span>
                <span v-else-if="maxPrice">
                        Max: {{ formatCurrency(maxPrice) }}
                    </span>
              </template>
            </va-badge>
          </div>
        </div>
      </div>

      <div class="table-container">
        <div v-if="isProductsError" class="error-container py-16 flex flex-col items-center justify-center">
          <va-icon name="error_outline" size="large" color="danger"/>
          <p class="mt-4 text-gray-600">Failed to load products. Please try again later.</p>
          <va-button class="mt-6" color="primary" @click="$router.go()">
            Retry
          </va-button>
        </div>

        <div v-else>
          <va-data-table
              :loading="isProductsLoading"
              :items="paginatedProducts"
              :columns="columns"
              striped
              hoverable
              class="products-table custom-alignment-table"
              :row-class="(rowData) => isProductOutOfStock(rowData) ? 'out-of-stock-row' : ''"
          >

            <template #cell(productInfo)="{ rowData }">
              <div class="product-info">
                <img v-if="rowData.productInfo.thumbnail" :src="rowData.productInfo.thumbnail"
                     :alt="rowData.productInfo.name"
                     class="w-12 h-12 object-cover rounded-md shadow-sm"/>
                <div v-else class="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center">
                  <va-icon name="image_not_supported" size="small" class="text-gray-400"/>
                </div>
                <div class="product-details">
                  <div class="font-medium">{{ rowData.productInfo.name }}</div>
                  <div v-if="rowData.productInfo.categoryName" class="text-xs text-gray-500">
                    {{ rowData.productInfo.categoryName }}
                  </div>
                </div>
              </div>
            </template>

            <template #cell(categoryName)="{ rowData }">
              <div class="category-name">
                {{ rowData.categoryName || '-' }}
              </div>
            </template>

            <template #cell(priceInfo)="{ rowData }">
              <div class="price-info">
                <div :class="rowData.priceInfo.hasDiscount ? 'line-through text-gray-500' : 'font-medium'">
                  {{ formatCurrency(rowData.priceInfo.price) }}
                </div>
                <div v-if="rowData.priceInfo.hasDiscount" class="font-medium text-green-600">
                  {{ formatCurrency(rowData.priceInfo.promotionalPrice) }}
                </div>
              </div>
            </template>

            <template #cell(sold)="{ rowData }">
              <div class="sell-count">
                {{ rowData.sold || 0 }}
              </div>
            </template>

            <template #cell(stock)="{ rowData }">
              <div class="stock-count">
                <div class="flex items-center gap-2">
                  <span :class="{ 'text-red-600 font-semibold': isProductOutOfStock(rowData) }">
                    {{ rowData.stock || 0 }}
                  </span>
                  <va-badge
                      v-if="isProductOutOfStock(rowData)"
                      text="Out of Stock"
                      color="danger"
                      class="out-of-stock-badge"
                  />
                </div>
              </div>
            </template>

            <template #cell(status)="{ rowData }">
              <va-badge :text="rowData.status ? 'Active' : 'Inactive'"
                        :color="rowData.status ? 'primary' : 'danger'" class="status-badge"/>
            </template>

            <template #cell(actions)="{ rowData }">
              <div class="flex items-center">
                <va-popover @mouseover="prefetchOnMouseOver(rowData.id)" placement="left"
                            :message="`Edit Product ${rowData.id}`" color="primary">
                  <div>
                    <va-button class="mr-2" icon="edit" size="small" color="info"
                               @click="goToEditProduct(rowData.id)"/>
                  </div>
                </va-popover>
                <va-popover placement="left" :message="`Deactivate Product ${rowData.id}`"
                            color="danger">
                  <div>
                    <va-button
                        v-if="rowData.status"
                        icon="pause_circle"
                        size="small"
                        color="danger"
                        :loading="deactivateMutation.isPending.value && deactivateMutation.variables.value === rowData.id"
                        @click="handleDeactivateProduct(rowData.id)"
                    />
                  </div>
                </va-popover>
              </div>
            </template>

            <template #bodyAppend v-if="filteredProducts.length === 0">
              <tr>
                <td :colspan="columns.length" class="text-center py-16">
                  <div class="empty-state flex flex-col items-center justify-center">
                    <va-icon name="inventory_2" size="large" class="mb-4 text-gray-400"/>
                    <h3 class="text-lg font-semibold text-gray-700 mb-2">No products found</h3>
                    <p class="text-gray-500 mb-6 max-w-md text-center">
                      No products match your current filters. Try changing your search criteria or clear filters.
                    </p>
                    <div class="flex gap-3">
                      <va-button
                          icon="filter_alt_off"
                          class="mr-2"
                          color="info"
                          @click="clearAllFilters">
                        Clear Filters
                      </va-button>
                      <va-button
                          icon="add"
                          color="primary"
                          @click="goToAddProduct">
                        Add Product
                      </va-button>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </va-data-table>

          <div class="pagination-controls flex flex-wrap justify-between items-center mt-6">
            <div class="items-per-page flex items-center mb-4 md:mb-0">
              <span class="text-gray-600 mr-3">Items per page:</span>
              <va-select
                  v-model="itemsPerPage"
                  :options="itemsPerPageOptions"
                  size="small"
                  class="items-per-page-select"
                  @update:modelValue="onItemsPerPageChange"
              />
            </div>

            <div class="flex items-center">
              <p class="text-gray-600 mr-4 hidden sm:block">
                Showing {{ (currentPage - 1) * itemsPerPage + 1 }}
                to {{ Math.min(currentPage * itemsPerPage, totalItems) }}
                of {{ totalItems }} items
              </p>
              <va-pagination
                  v-model="currentPage"
                  :pages="totalPages"
                  :visible-pages="5"
                  :boundary-links="true"
                  color="#4318FF"
                  @update:modelValue="onPageChange"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.products-page {
  animation: fadeIn 0.3s ease-in-out;
}

.search-input {
  min-width: 250px;
}

.filters-container {
  display: flex;
  flex-wrap: wrap;
}

.filter-select {
  min-width: 180px;
}

.products-table {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
}

.status-badge, .discount-badge {
  min-width: 60px;
  min-height: 24px;
  font-weight: 500;
  --va-badge-font-size: 0.875rem;
  --va-badge-text-px: 0.5rem;
  --va-badge-text-py: 0.125rem;
}

.product-info {
  display: flex;
  align-items: center;
  padding: 0.5rem 0;
}

.product-details {
  margin-left: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.product-details .font-medium {
  line-height: 1.2;
  margin-bottom: 0.25rem;
}

.product-info img,
.product-info .w-12 {
  border: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.price-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.price-info .text-green-600 {
  font-weight: 600;
}

.category-name {
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.sell-count {
  font-weight: 500;
}

.stock-count {
  font-weight: 500;
}

.out-of-stock-badge {
  font-size: 0.75rem;
  min-width: 80px;
  min-height: 20px;
  --va-badge-text-px: 0.4rem;
  --va-badge-text-py: 0.1rem;
  font-weight: 600;
}

.out-of-stock-row {
  background-color: #fef2f2 !important;
  border-left: 4px solid #dc2626 !important;
}

.out-of-stock-row:hover {
  background-color: #fee2e2 !important;
}

.loading-container,
.error-container {
  min-height: 300px;
}

.items-per-page-select {
  width: 70px;
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
  .filters-container {
    width: 100%;
  }

  .search-input,
  .filter-select,
  .price-filter-btn {
    width: 100%;
  }

  .filters-container {
    flex-direction: column;
    gap: 12px;
  }

  .price-filter-container .flex {
    flex-direction: column;
    gap: 12px;
  }

  .price-input-group,
  .price-actions {
    width: 100%;
  }

  .price-actions {
    width: 100%;
    display: flex;
    justify-content: space-between;
  }

  .price-actions .va-button,
  .apply-button,
  .reset-button {
    flex: 1;
    margin: 0 4px;
  }

  .price-filter-summary {
    width: 100%;
    margin-top: 8px;
  }

  .add-button {
    width: 100%;
  }

  .pagination-controls {
    flex-direction: column;
  }

  .pagination-controls > div {
    width: 100%;
    justify-content: center;
    margin-bottom: 1rem;
  }
}

:deep(.va-data-table__thead th) {
  text-align: left;
}

:deep(.va-data-table__tbody td) {
  text-align: left;
}

.status-badge {
  min-width: 60px;
  min-height: 24px;
  font-weight: 500;
  --va-badge-font-size: 0.875rem;
  --va-badge-text-px: 0.5rem;
  --va-badge-text-py: 0.125rem;
  display: inline-flex;
}

:deep(.va-data-table__cell) {
  justify-content: flex-start;
}

.custom-alignment-table :deep(td),
.custom-alignment-table :deep(th) {
  text-align: left !important;
}

.custom-alignment-table :deep(.va-data-table__td) {
  justify-content: flex-start !important;
}

.custom-alignment-table :deep(.va-data-table__td-content) {
  justify-content: flex-start !important;
  width: 100%;
}

.empty-state {
  padding: 2rem 1rem;
}

.empty-state .va-icon {
  font-size: 4rem;
  opacity: 0.7;
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

.empty-state {
  animation: fadeIn 0.4s ease-in-out;
}

.filter-select {
  min-width: 180px;
}

.price-filter-btn {
  height: 38px;
  display: flex;
  align-items: center;
}

.price-filter-container {
  animation: fadeIn 0.2s ease-in-out;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.price-input-group {
  min-width: 120px;
}

.price-input {
  width: 100%;
}

.price-filter-summary {
  font-size: 0.875rem;
}

.price-filter-summary .va-badge {
  padding: 0.25rem 0.5rem;
  font-weight: 500;
}

.apply-button, .reset-button {
  min-width: 85px;
  height: 36px;
}

.apply-button :deep(.va-button__content),
.reset-button :deep(.va-button__content) {
  display: flex;
  align-items: center;
  gap: 4px;
}

.deactivated-badge {
  background-color: #e5e7eb;
  color: #6b7280;
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
}
</style>
