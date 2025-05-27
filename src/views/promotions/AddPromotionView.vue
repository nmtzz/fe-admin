<template>
  <div class="add-promotion-page">

    <div class="page-header mb-6">
      <h1 class="text-2xl font-bold">Add New Promotion</h1>
      <p class="text-gray-600 mt-2">Create a new promotional discount for your products</p>
    </div>

    <div class="bg-white p-6 rounded-lg shadow-sm">
      <form @submit.prevent="savePromotion">

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div>
            <h2 class="text-lg font-semibold mb-4">Promotion Details</h2>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1" for="promotion-name">
                Promotion Name*
              </label>
              <va-input
                  id="promotion-name"
                  v-model="promotion.name"
                  placeholder="Enter promotion name"
                  class="w-full"
                  required
              />
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1" for="discount-percentage">
                Discount Percentage*
              </label>
              <va-input
                  id="discount-percentage"
                  v-model="promotion.discountPercentage"
                  type="number"
                  placeholder="0-100"
                  min="1"
                  max="100"
                  class="w-full"
                  required
              />
              <p class="text-xs text-gray-500 mt-1">Enter a value between 1 and 100</p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1" for="start-date">
                  Start Date*
                </label>
                <va-date-input
                    id="start-date"
                    v-model="promotion.startDate"
                    :format-date="formatDate"
                    :parse-date="parseDate"
                    placeholder="Start date"
                    class="w-full"
                    :allowed-days="(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const selectedDate = new Date(date);
                      selectedDate.setHours(0, 0, 0, 0);
                      return selectedDate >= today;
                    }"
                    required
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1" for="end-date">
                  End Date*
                </label>
                <va-date-input
                    id="end-date"
                    v-model="promotion.endDate"
                    :format-date="formatDate"
                    :parse-date="parseDate"
                    placeholder="End date"
                    class="w-full"
                    :allowed-days="(date) => !promotion.startDate || new Date(date) >= new Date(promotion.startDate)"
                    required
                />
              </div>
            </div>
          </div>

          <div>
            <h2 class="text-lg font-semibold mb-4">Translations</h2>

            <div v-for="(translation, index) in promotionTranslations" :key="index" class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                {{ translation.language }} Name
              </label>
              <va-input
                  v-model="translation.translatedName"
                  :placeholder="`Enter name in ${translation.language}`"
                  class="w-full"
              />
            </div>
          </div>
        </div>

        <div class="mb-8">
          <h2 class="text-lg font-semibold mb-4">Selected Products</h2>
          <p class="text-sm text-gray-600 mb-4">
            Choose which products this promotion will apply to
          </p>

          <div class="mb-4 flex flex-wrap gap-3 items-end">
            <va-button
                color="primary"
                icon="add"
                @click="showProductsModal = true"
                class="mb-2"
            >
              Add Products
            </va-button>

            <va-select
                v-model="selectedCategoryFilter"
                :options="categoryOptions"
                textBy="text"
                valueBy="value"
                :loading="isProductsLoading"
                color="primary"
                class="filter-select mb-2"
                placeholder="Filter by category"
            />

            <va-button
                icon="attach_money"
                color="primary"
                flat
                class="price-filter-btn mb-2"
                @click="showSelectedPriceFilter = !showSelectedPriceFilter"
            >
              Price Filter
            </va-button>
          </div>

          <div v-if="showSelectedPriceFilter"
               class="price-filter-container mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div class="flex flex-wrap items-end gap-4">
              <div class="price-input-group">
                <label class="block text-sm font-medium text-gray-600 mb-1">Min Price</label>
                <va-input
                    v-model="selectedMinPrice"
                    placeholder="Min price"
                    class="price-input"
                />
              </div>

              <div class="price-input-group">
                <label class="block text-sm font-medium text-gray-600 mb-1">Max Price</label>
                <va-input
                    v-model="selectedMaxPrice"
                    placeholder="Max price"
                    class="price-input"
                />
              </div>

              <div class="price-actions flex gap-2">
                <va-button
                    icon="restart_alt"
                    size="small"
                    class="reset-button"
                    :style="{ backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb' }"
                    @click="resetSelectedPriceFilter"
                >
                  Reset
                </va-button>
              </div>

              <div v-if="selectedMinPrice || selectedMaxPrice" class="price-filter-summary flex items-center">
                <va-badge color="primary" class="mr-2">
                  <template #default>
                    <span v-if="selectedMinPrice && selectedMaxPrice">
                      {{ displayCurrency(selectedMinPrice) }} - {{ displayCurrency(selectedMaxPrice) }}
                    </span>
                    <span v-else-if="selectedMinPrice">
                      Min: {{ displayCurrency(selectedMinPrice) }}
                    </span>
                    <span v-else-if="selectedMaxPrice">
                      Max: {{ displayCurrency(selectedMaxPrice) }}
                    </span>
                  </template>
                </va-badge>
              </div>
            </div>
          </div>

          <div class="table-container mb-4">
            <div v-if="isProductsError" class="error-container py-8 flex flex-col items-center justify-center">
              <va-icon name="error_outline" size="large" color="danger"/>
              <p class="mt-4 text-gray-600">Failed to load products. Please try again later.</p>
            </div>

            <div v-else>
              <va-data-table
                  :items="filteredSelectedProducts"
                  :columns="selectedProductColumns"
                  :loading="isProductsLoading"
                  striped
                  hoverable
                  class="products-table custom-alignment-table"
              >

                <template #cell(name)="{ rowData }">
                  <div class="product-name font-medium">
                    {{ rowData.name }}
                  </div>
                </template>

                <template #cell(categoryName)="{ rowData }">
                  <div class="category-name">
                    {{ rowData.categoryName || '-' }}
                  </div>
                </template>

                <template #cell(price)="{ rowData }">
                  <div class="price">
                    {{ displayCurrency(rowData.price) }}
                  </div>
                </template>

                <template #cell(promotionPrice)="{ rowData }">
                  <div class="promotion-price">
                    {{ displayCurrency(calculatePromotionPrice(rowData.price)) }}
                  </div>
                </template>

                <template #cell(actions)="{ rowData }">
                  <div class="actions">
                    <va-button
                        icon="delete_outline"
                        size="small"
                        color="danger"
                        flat
                        @click="removeProduct(rowData)"
                        title="Remove product"
                    />
                  </div>
                </template>

                <template #bodyAppend v-if="filteredSelectedProducts.length === 0 && !isProductsLoading">
                  <tr>
                    <td :colspan="selectedProductColumns.length" class="text-center py-8">
                      <div class="empty-state flex flex-col items-center justify-center">
                        <va-icon name="inventory_2" size="large" class="mb-4 text-gray-400"/>
                        <p class="text-gray-500 mb-4">
                          No products selected for this promotion
                        </p>
                        <va-button
                            color="primary"
                            icon="add"
                            @click="showProductsModal = true"
                        >
                          Add Products
                        </va-button>
                      </div>
                    </td>
                  </tr>
                </template>
              </va-data-table>

              <div v-if="filteredSelectedProducts.length > 0" class="mt-4 p-3 bg-gray-50 rounded-md">
                <p class="text-sm font-medium">
                  {{ filteredSelectedProducts.length }} product{{ filteredSelectedProducts.length !== 1 ? 's' : '' }}
                  selected
                </p>
              </div>
            </div>
          </div>
        </div>

        <va-modal
            v-model="showProductsModal"
            title="Select Products"
            :message="isProductsError ? 'Failed to load products.' : ''"
            overlay
            size="large"
            fixed-layout
            hide-default-actions
        >
          <template #default>

            <div class="mb-4 flex flex-wrap gap-3 items-end">
              <va-input
                  v-model="productSearchQuery"
                  placeholder="Search products..."
                  icon="search"
                  class="search-input mb-2"
              />

              <va-select
                  v-model="modalCategoryFilter"
                  :options="categoryOptions"
                  textBy="text"
                  valueBy="value"
                  :loading="isProductsLoading"
                  color="primary"
                  class="filter-select mb-2"
                  placeholder="Filter by category"
              />

              <va-button
                  icon="attach_money"
                  color="primary"
                  flat
                  class="price-filter-btn mb-2"
                  @click="showModalPriceFilter = !showModalPriceFilter"
              >
                Price Filter
              </va-button>
            </div>

            <div v-if="showModalPriceFilter"
                 class="price-filter-container mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div class="flex flex-wrap items-end gap-4">
                <div class="price-input-group">
                  <label class="block text-sm font-medium text-gray-600 mb-1">Min Price</label>
                  <va-input
                      v-model="modalMinPrice"
                      placeholder="Min price"
                      class="price-input"
                  />
                </div>

                <div class="price-input-group">
                  <label class="block text-sm font-medium text-gray-600 mb-1">Max Price</label>
                  <va-input
                      v-model="modalMaxPrice"
                      placeholder="Max price"
                      class="price-input"
                  />
                </div>

                <div class="price-actions flex gap-2">
                  <va-button
                      icon="restart_alt"
                      size="small"
                      class="reset-button"
                      :style="{ backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb' }"
                      @click="resetModalPriceFilter"
                  >
                    Reset
                  </va-button>
                </div>

                <div v-if="modalMinPrice || modalMaxPrice" class="price-filter-summary flex items-center">
                  <va-badge color="primary" class="mr-2">
                    <template #default>
                      <span v-if="modalMinPrice && modalMaxPrice">
                        {{ displayCurrency(modalMinPrice) }} - {{ displayCurrency(modalMaxPrice) }}
                      </span>
                      <span v-else-if="modalMinPrice">
                        Min: {{ displayCurrency(modalMinPrice) }}
                      </span>
                      <span v-else-if="modalMaxPrice">
                        Max: {{ displayCurrency(modalMaxPrice) }}
                      </span>
                    </template>
                  </va-badge>
                </div>
              </div>
            </div>

            <div class="modal-table-container">

              <va-data-table
                  v-model:selected="temporarySelectedProducts"
                  :items="filteredProducts"
                  :columns="productColumns"
                  :loading="isProductsLoading"
                  striped
                  hoverable
                  selectable
                  select-mode="multiple"
                  selected-color="primary"
                  class="products-table custom-alignment-table"
                  @selection-change="handleSelectionChange"
              >

                <template #cell(name)="{ rowData }">
                  <div class="product-name font-medium">
                    {{ rowData.name }}
                  </div>
                </template>

                <template #cell(categoryName)="{ rowData }">
                  <div class="category-name">
                    {{ rowData.categoryName || '-' }}
                  </div>
                </template>

                <template #cell(price)="{ rowData }">
                  <div class="price">
                    {{ displayCurrency(rowData.price) }}
                  </div>
                </template>

                <template #cell(promotionPrice)="{ rowData }">
                  <div class="promotion-price font-medium">
                    {{ displayCurrency(calculatePromotionPrice(rowData.price)) }}
                    <div class="discount-badge text-xs">
                      <va-badge color="success" size="small">
                        -{{ promotion.discountPercentage || 0 }}%
                      </va-badge>
                    </div>
                  </div>
                </template>

                <template #bodyAppend v-if="filteredProducts.length === 0 && !isProductsLoading">
                  <tr>
                    <td :colspan="productColumns.length" class="text-center py-8">
                      <div class="empty-state flex flex-col items-center justify-center">
                        <va-icon name="search_off" size="large" class="mb-4 text-gray-400"/>
                        <p v-if="productSearchQuery" class="text-gray-500">
                          No products match your search. Try a different keyword.
                        </p>
                        <p v-else class="text-gray-500">
                          No products available to add to this promotion.
                        </p>
                      </div>
                    </td>
                  </tr>
                </template>
              </va-data-table>
            </div>

            <div v-if="temporarySelectedProducts.length > 0" class="mt-4 p-3 bg-gray-50 rounded-md">
              <p class="text-sm font-medium">
                {{ temporarySelectedProducts.length }} product{{ temporarySelectedProducts.length !== 1 ? 's' : '' }}
                selected
              </p>
            </div>
          </template>

          <template #footer>
            <div class="flex justify-end">
              <va-button preset="secondary" class="mr-3" @click="cancelProductSelection">
                Cancel
              </va-button>
              <va-button @click="confirmProductSelection">
                Add Selected Products
              </va-button>
            </div>
          </template>
        </va-modal>

        <div class="flex justify-end space-x-4">
          <va-button
              preset="secondary"
              @click="$router.push('/promotions')"
          >
            Cancel
          </va-button>
          <va-button
              type="submit"
              color="primary"
              :loading="saveMutation.isPending.value"
              :disabled="saveMutation.isPending.value"
          >
            Save Promotion
          </va-button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import {computed, ref, watch} from "vue";
import {useMutation, useQuery, useQueryClient} from "@tanstack/vue-query";
import {useRouter} from "vue-router";
import {useToast} from "vuestic-ui";
import axios from "axios";
import {localeStore} from "@/stores/localeStore.js";
import {displayCurrency, formatDate, parseDate} from "@/utils/localeUtil.js";

const router = useRouter();
const {notify} = useToast();

const promotion = ref({
  name: '',
  discountPercentage: null,
  startDate: null,
  endDate: null,
  promotionDetails: [],
  promotionTranslations: []
});

const promotionTranslations = ref([]);
localeStore.availableLocales.forEach(locale => {
  promotionTranslations.value.push({
    language: locale,
    translatedName: ''
  });
});

const selectedProducts = ref([]);
const temporarySelectedProducts = ref([]);
const productSearchQuery = ref('');
const showProductsModal = ref(false);

const selectedCategoryFilter = ref('all');
const selectedMinPrice = ref('');
const selectedMaxPrice = ref('');
const showSelectedPriceFilter = ref(false);

const modalCategoryFilter = ref('all');
const modalMinPrice = ref('');
const modalMaxPrice = ref('');
const showModalPriceFilter = ref(false);

const productColumns = [
  {
    key: 'name',
    label: 'Product Name',
    sortable: true,
  },
  {
    key: 'categoryName',
    label: 'Category',
    sortable: true,
  },
  {
    key: 'price',
    label: 'Original Price',
    sortable: true,
  },
  {
    key: 'promotionPrice',
    label: 'Promotion Price',
    sortable: true,
  }
];

const selectedProductColumns = [
  ...productColumns,
  {
    key: 'actions',
    label: 'Actions',
    width: '80px',
  }
];

const {
  data: products,
  isPending: isProductsLoading,
  isError: isProductsError
} = useQuery({
  queryKey: ['products'],
  queryFn: async () => {
    const {data} = await axios.get('/products');
    return data;
  }
});

const categoryOptions = computed(() => {
  if (!products?.value?.result) return [{text: 'All Categories', value: 'all'}];

  const options = [{text: 'All Categories', value: 'all'}];

  products.value.result.forEach(product => {
    if (product.categoryName && product.categoryId && !options.find(option => option.value === product.categoryId.toString())) {
      options.push({
        text: product.categoryName,
        value: product.categoryId.toString()
      });
    }
  });

  return options;
});

const filteredProducts = computed(() => {
  if (!products?.value?.result) return [];

  let filtered = products.value.result;

  const selectedIds = new Set(selectedProducts.value.map(p => p.id));
  filtered = filtered.filter(product => !selectedIds.has(product.id));

  if (modalCategoryFilter.value !== 'all') {
    filtered = filtered.filter(product =>
        product.categoryId === parseInt(modalCategoryFilter.value));
  }

  if (modalMinPrice.value) {
    filtered = filtered.filter(product => product.price >= Number(modalMinPrice.value));
  }

  if (modalMaxPrice.value) {
    filtered = filtered.filter(product => product.price <= Number(modalMaxPrice.value));
  }

  if (productSearchQuery.value) {
    const query = productSearchQuery.value.toLowerCase();
    filtered = filtered.filter(product =>
        product.name?.toLowerCase().includes(query) ||
        product.categoryName?.toLowerCase().includes(query)
    );
  }

  return filtered;
});

const filteredSelectedProducts = computed(() => {
  if (!selectedProducts.value.length) return [];

  let filtered = [...selectedProducts.value];

  if (selectedCategoryFilter.value !== 'all') {
    filtered = filtered.filter(product =>
        product.categoryId === parseInt(selectedCategoryFilter.value));
  }

  if (selectedMinPrice.value) {
    filtered = filtered.filter(product => product.price >= Number(selectedMinPrice.value));
  }

  if (selectedMaxPrice.value) {
    filtered = filtered.filter(product => product.price <= Number(selectedMaxPrice.value));
  }

  return filtered;
});

const resetSelectedPriceFilter = () => {
  selectedMinPrice.value = '';
  selectedMaxPrice.value = '';
};

const resetModalPriceFilter = () => {
  modalMinPrice.value = '';
  modalMaxPrice.value = '';
};

const validateForm = () => {
  const errors = [];

  if (!promotion.value.name) {
    errors.push('Promotion name is required');
  }

  if (!promotion.value.discountPercentage) {
    errors.push('Discount percentage is required');
  } else if (promotion.value.discountPercentage < 1 || promotion.value.discountPercentage > 100) {
    errors.push('Discount must be between 1 and 100');
  }

  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  if (!promotion.value.startDate) {
    errors.push('Start date is required');
  } else {
    const startDate = new Date(promotion.value.startDate);
    startDate.setHours(0, 0, 0, 0);

    if (startDate < currentDate) {
      errors.push('Start date cannot be in the past');
    }
  }

  if (!promotion.value.endDate) {
    errors.push('End date is required');
  } else {
    const endDate = new Date(promotion.value.endDate);
    endDate.setHours(0, 0, 0, 0);

    if (promotion.value.startDate && new Date(promotion.value.startDate) >= endDate) {
      errors.push('End date must be after start date');
    } else if (endDate < currentDate) {
      errors.push('End date cannot be in the past');
    }
  }

  if (selectedProducts.value.length === 0) {
    errors.push('Please select at least one product');
  }

  return errors;
};

const queryClient = useQueryClient()
const saveMutation = useMutation({
  mutationFn: async (promotionData) => {
    console.log('Promotion data before sending:', promotionData);
    return await axios.post('/promotions', promotionData);

  },
  onSuccess: () => {
    queryClient.invalidateQueries({queryKey: ['promotions']})
    notify({
      message: 'Promotion created successfully',
      color: 'success',
    });
    router.push('/promotions');
  },
  onError: (error) => {
    notify({
      message: 'Failed to create promotion',
      color: 'danger',
    });
    console.error('Error saving promotion:', error);
  }
});

const savePromotion = async () => {
  const validationErrors = validateForm();

  if (validationErrors.length > 0) {

    validationErrors.forEach(error => {
      setTimeout(() => {
        notify({
          message: error,
          color: 'warning',
          duration: 4000,
        });
      }, 100);
    });
    return;
  }

  try {

    const setStartOfDay = (date) => {
      const newDate = new Date(date)
      newDate.setHours(0, 0, 0, 0)
      return newDate
    }

    const setEndOfDay = (date) => {
      const newDate = new Date(date)
      newDate.setHours(23, 59, 59, 999)
      return newDate
    }

    const promotionData = {
      name: promotion.value.name,
      discountPercentage: parseInt(promotion.value.discountPercentage),
      startDate: setStartOfDay(promotion.value.startDate).toISOString(),
      endDate: setEndOfDay(promotion.value.endDate).toISOString(),

      promotionDetails: selectedProducts.value.map(product => ({
        productId: product.id
      })),

      promotionTranslations: promotionTranslations.value
          .filter(t => t.translatedName.trim() !== '')
          .map(t => ({
            language: t.language,
            translatedName: t.translatedName
          }))
    };

    await saveMutation.mutateAsync(promotionData);
  } catch (error) {
    console.error('Error in savePromotion:', error);
  }
};

const removeProduct = (product) => {
  selectedProducts.value = selectedProducts.value.filter(p => p.id !== product.id);
};

const handleSelectionChange = (event) => {
  temporarySelectedProducts.value = event.currentSelectedItems;
};

const cancelProductSelection = () => {
  showProductsModal.value = false;
};

const confirmProductSelection = () => {

  const existingProductsMap = new Map();
  selectedProducts.value.forEach(product => {
    existingProductsMap.set(product.id, product);
  });

  temporarySelectedProducts.value.forEach(product => {
    if (!existingProductsMap.has(product.id)) {
      selectedProducts.value.push(product);
    }
  });

  showProductsModal.value = false;
};

watch(showProductsModal, (isOpen) => {
  if (isOpen) {

    const selectedIds = new Set(selectedProducts.value.map(p => p.id));
    temporarySelectedProducts.value = filteredProducts.value.filter(p => selectedIds.has(p.id));
  }
});

const calculatePromotionPrice = (originalPrice) => {
  if (!originalPrice || !promotion.value.discountPercentage) return originalPrice;

  const discount = promotion.value.discountPercentage / 100;
  const discountedPrice = originalPrice * (1 - discount);

  return Math.round(discountedPrice * 100) / 100;
};
</script>

<style scoped>
.add-promotion-page {
  animation: fadeIn 0.3s ease-in-out;
}

.products-table {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
}

.product-name {
  color: #374151;
}

.category-name, .price {
  font-size: 0.875rem;
  color: #4B5563;
}

.empty-state {
  padding: 2rem 1rem;
}

.empty-state .va-icon {
  font-size: 3rem;
  opacity: 0.7;
}

:deep(.va-data-table__thead th) {
  text-align: left;
}

:deep(.va-data-table__tbody td) {
  text-align: left;
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

.search-input {
  min-width: 250px;
}

.price-filter-summary {
  font-size: 0.875rem;
}

.price-filter-summary .va-badge {
  padding: 0.25rem 0.5rem;
  font-weight: 500;
}

.reset-button {
  min-width: 85px;
  height: 36px;
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

.modal-table-container {
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
}
</style>
