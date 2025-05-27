<script setup>
import {useMutation, useQuery, useQueryClient} from '@tanstack/vue-query';
import {useModal, useToast} from 'vuestic-ui';
import axios from 'axios';
import {useRouter} from 'vue-router';
import {computed, ref, watch} from 'vue';
import {displayCurrency, displayDate, formatDate} from "@/utils/localeUtil.js";

const queryClient = useQueryClient()
const router = useRouter();
const searchQuery = ref('');
const statusFilter = ref('all');
const {notify} = useToast()
const {confirm} = useModal()

const startDateFilter = ref(null);
const endDateFilter = ref(null);
const showDateFilter = ref(false);

const currentPage = ref(1)
const itemsPerPage = ref(10)
const itemsPerPageOptions = [5, 10, 20, 50]

const {data: vouchers, isPending: isVouchersLoading, isError: isVouchersError, refetch: refetchVouchers} = useQuery({
  queryKey: ['vouchers'],
  queryFn: async () => {
    const {data} = await axios.get('/vouchers')
    return data
  }
})

const deleteMutation = useMutation({
  mutationFn: async (voucherId) => {

    return await axios.delete(`/vouchers/${voucherId}`)
  },
  onSuccess: (data, variables) => {
    queryClient.invalidateQueries({queryKey: ['vouchers']})
    queryClient.invalidateQueries({queryKey: [`vouchers/${variables}`]})
    queryClient.resetQueries([`vouchers/${variables}`])
    queryClient.removeQueries([`vouchers/${variables}`])
    notify({
      message: 'Voucher deleted successfully',
      color: 'success',
    })
  },
  onError: (error) => {
    notify({
      message: `Failed to delete voucher: ${error.response?.data?.message || error.response?.data?.error || 'Unknown error'}`,
      color: 'danger',
    })
  }
})

const deactivateMutation = useMutation({
  mutationFn: async (voucherId) => {
    return await axios.patch(`/vouchers/${voucherId}/deactivate`)
  },
  onSuccess: (data, variables) => {
    queryClient.invalidateQueries({queryKey: ['vouchers']})
    notify({
      message: 'Voucher deactivated successfully',
      color: 'success',
    })
  },
  onError: (error) => {
    notify({
      message: `Failed to deactivate voucher: ${error.response?.data?.message || error.response?.data?.error || 'Unknown error'}`,
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
    key: 'code',
    label: 'Code',
    sortable: true,
  },
  {
    key: 'discountInfo',
    label: 'Discount',
    sortable: true,
  },
  {
    key: 'validity',
    label: 'Validity Period',
  },
  {
    key: 'orderValues',
    label: 'Order Value Limits',
  },
  {
    key: 'used',
    label: 'Used',
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

const goToAddVoucher = () => {
  router.push('/vouchers/add');
}

const prefetchOnMouseOver = (voucherId) => {
  if (queryClient.getQueryData([`vouchers/${voucherId}`])) return;
  queryClient.prefetchQuery({
    queryKey: [`vouchers/${voucherId}`],
    queryFn: async () => {
      const {data} = await axios.get(`/vouchers/${voucherId}`)
      return data
    },
  })
}

const goToEditVoucher = async (voucherId) => {
  await router.push(`/vouchers/${voucherId}`);
}

const handleDeactivateVoucher = (voucherId) => {
  confirm({
    title: 'Deactivate Voucher',
    message: 'Are you sure you want to deactivate this voucher?',
    okText: 'Deactivate',
    cancelText: 'Cancel',
    child: {
      okButton: {
        color: 'warning'
      }
    }
  }).then((confirmed) => {
    if (confirmed) {
      deactivateMutation.mutate(voucherId)
    }
  })
}

const handleDeleteVoucher = (voucherId) => {
  confirm({
    title: 'Delete Voucher',
    message: 'Are you sure you want to delete this voucher? This action cannot be undone.',
    okText: 'Delete',
    cancelText: 'Cancel',
    child: {
      okButton: {
        color: 'danger'
      }
    }
  }).then((confirmed) => {
    if (confirmed) {
      deleteMutation.mutate(voucherId)
    }
  })
}

const filteredVouchers = computed(() => {
  if (!vouchers?.value?.result) return [];

  let filtered = vouchers.value.result;

  if (statusFilter.value !== 'all') {
    const isActive = statusFilter.value === 'active';
    filtered = filtered.filter(voucher => voucher.status === isActive);
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(voucher =>
        voucher.code.toLowerCase().includes(query)
    );
  }

  if (startDateFilter.value) {
    const filterStart = new Date(startDateFilter.value);
    filtered = filtered.filter(voucher => {
      const voucherStart = new Date(voucher.startDate);
      return voucherStart >= filterStart;
    });
  }

  if (endDateFilter.value) {
    const filterEnd = new Date(endDateFilter.value);
    filtered = filtered.filter(voucher => {
      const voucherEnd = new Date(voucher.endDate).setHours(0, 0, 0, 0);
      return voucherEnd <= filterEnd;
    });
  }

  return filtered;
});

const formatDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return '-';
  return `${displayDate(startDate)} - ${displayDate(endDate)}`;
};

const resetDateFilter = () => {
  startDateFilter.value = null;
  endDateFilter.value = null;
  resetPage();
};

const clearAllFilters = () => {
  statusFilter.value = 'all';
  searchQuery.value = '';
  resetDateFilter();
};

const resetPage = () => {
  currentPage.value = 1;
};

watch([statusFilter, startDateFilter, endDateFilter, searchQuery], () => {
  resetPage();
}, {deep: true});

const totalItems = computed(() => filteredVouchers.value.length)
const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value))

const paginatedVouchers = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage.value
  const endIndex = startIndex + itemsPerPage.value

  return filteredVouchers.value.slice(startIndex, endIndex).map(voucher => ({
    ...voucher,
    discountInfo: {
      type: voucher.discountType,
      value: voucher.discountAmount,
      maxDiscount: voucher.maxDiscountAmount
    },
    validity: {
      startDate: voucher.startDate,
      endDate: voucher.endDate
    },
    orderValues: {
      minOrderValue: voucher.minOrderAmount,
      maxOrderValue: voucher.maxOrderAmount
    },
    remaining: voucher.quantity - voucher.used
  }))
})

const onPageChange = (page) => {
  currentPage.value = page
}

const onItemsPerPageChange = (value) => {
  itemsPerPage.value = value
  resetPage()
}

const isVoucherExpired = (voucher) => {
  const now = new Date().getTime();
  const end = new Date(voucher.validity.endDate).getTime();

  if (isNaN(end)) return false;

  return now > end;
}

const isVoucherActive = (voucher) => {
  return voucher.status;
}

const isVoucherOutOfStock = (voucher) => {
  return voucher.used >= voucher.quantity;
}
</script>

<template>
  <div class="vouchers-page">
    <div class="page-header mb-6 flex flex-wrap items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Vouchers</h1>
        <p class="text-gray-600 mt-2">Manage discount vouchers for your store</p>
      </div>
      <div class="mt-4 sm:mt-0">
        <va-button color="primary" gradient icon="add" class="add-button" @click="goToAddVoucher">
          Add Voucher
        </va-button>
      </div>
    </div>

    <div class="bg-white p-6 rounded-lg shadow-sm">
      <div class="flex flex-wrap items-center justify-between mb-6">
        <div class="search-container w-full md:w-auto mb-4 md:mb-0">
          <va-input v-model="searchQuery" placeholder="Search vouchers..." icon="search"
                    class="search-input"/>
        </div>
        <div class="filters-container flex flex-wrap gap-3">
          <va-select
              v-model="statusFilter"
              :options="[
                  { text: 'All Vouchers', value: 'all' },
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
              icon="date_range"
              color="primary"
              flat
              class="date-filter-btn"
              @click="showDateFilter = !showDateFilter"
          >
            Date Filter
          </va-button>
        </div>
      </div>

      <div v-if="showDateFilter" class="date-filter-container mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <div class="flex flex-wrap items-end gap-4">
          <div class="date-input-group">
            <label class="block text-sm font-medium text-gray-600 mb-1">Start Date</label>
            <va-date-input
                v-model="startDateFilter"
                placeholder="Start date"
                class="date-input"
                :format-date="formatDate"
            />
          </div>

          <div class="date-input-group">
            <label class="block text-sm font-medium text-gray-600 mb-1">End Date</label>
            <va-date-input
                v-model="endDateFilter"
                placeholder="End date"
                class="date-input"
                :format-date="formatDate"
                :allowed-days="(date) => !startDateFilter || new Date(date) >= new Date(startDateFilter).setHours(0,0,0,0)"
            />
          </div>

          <div class="date-actions flex gap-2">
            <va-button
                size="small"
                icon="restart_alt"
                class="reset-button"
                @click="resetDateFilter"
            >
              Reset
            </va-button>
          </div>

          <div v-if="startDateFilter || endDateFilter" class="date-filter-summary flex items-center">
            <va-badge color="primary" class="mr-2">
              <template #default>
                <span v-if="startDateFilter && endDateFilter">
                  {{ displayDate(startDateFilter) }} - {{ displayDate(endDateFilter) }}
                </span>
                <span v-else-if="startDateFilter">
                  From: {{ displayDate(startDateFilter) }}
                </span>
                <span v-else-if="endDateFilter">
                  Until: {{ displayDate(endDateFilter) }}
                </span>
              </template>
            </va-badge>
          </div>
        </div>
      </div>

      <div class="table-container">
        <div v-if="isVouchersError" class="error-container py-16 flex flex-col items-center justify-center">
          <va-icon name="error_outline" size="large" color="danger"/>
          <p class="mt-4 text-gray-600">Failed to load vouchers. Please try again later.</p>
          <va-button class="mt-6" color="primary" @click="refetchVouchers">
            Retry
          </va-button>
        </div>

        <div v-else>
          <va-data-table :loading="isVouchersLoading" :items="paginatedVouchers" :columns="columns"
                         striped hoverable class="vouchers-table custom-alignment-table"
                         :row-class="(rowData) => isVoucherOutOfStock(rowData) ? 'out-of-stock-row' : ''">

            <template #cell(code)="{ rowData }">
              <div class="voucher-code" :class="{ 'out-of-stock': isVoucherOutOfStock(rowData) }">
                {{ rowData.code }}
              </div>
            </template>

            <template #cell(discountInfo)="{ rowData }">
              <div class="discount-info">
                <va-badge :color="rowData.discountInfo.type === 'FIXED' ? 'primary' : 'success'" class="discount-badge">
                  {{
                    rowData.discountInfo.type === 'FIXED' ? displayCurrency(rowData.discountInfo.value) : `${rowData.discountInfo.value}%`
                  }}
                </va-badge>
                <div v-if="rowData.discountInfo.type === 'PERCENTAGE' && rowData.discountInfo.maxDiscount"
                     class="text-sm mt-1">
                  Max: {{ displayCurrency(rowData.discountInfo.maxDiscount) }}
                </div>
              </div>
            </template>

            <template #cell(validity)="{ rowData }">
              <div class="date-range">
                {{ formatDateRange(rowData.validity.startDate, rowData.validity.endDate) }}
                <div v-if="isVoucherExpired(rowData)">
                  <span class="text-sm text-red-500">
                    Expired
                  </span>
                </div>
              </div>
            </template>

            <template #cell(orderValues)="{ rowData }">
              <div class="order-limits">
                <div v-if="rowData.orderValues.minOrderValue">
                  Min: {{ displayCurrency(rowData.orderValues.minOrderValue) }}
                </div>
                <div v-if="rowData.orderValues.maxOrderValue">
                  Max: {{ displayCurrency(rowData.orderValues.maxOrderValue) }}
                </div>
                <div v-if="!rowData.orderValues.minOrderValue && !rowData.orderValues.maxOrderValue">
                  No limits
                </div>
              </div>
            </template>

            <template #cell(used)="{ rowData }">
              <div class="used-count">
                <div class="flex items-center gap-2">
                  <span :class="{ 'text-red-600 font-semibold': isVoucherOutOfStock(rowData) }">
                    {{ rowData.used }}/{{ rowData.quantity }}
                  </span>
                  <va-badge
                      v-if="isVoucherOutOfStock(rowData)"
                      text="Out of Stock"
                      color="danger"
                      class="out-of-stock-badge"
                  />
                </div>
              </div>
            </template>

            <template #cell(status)="{ rowData }">
              <div>
                <va-badge
                    :text="isVoucherActive(rowData) ? 'Active' : 'Inactive'"
                    :color="isVoucherActive(rowData) ? 'primary' : 'danger'"
                    class="status-badge"
                />
              </div>
            </template>

            <template #cell(actions)="{ rowData }">
              <div class="flex items-center">
                <va-popover @mouseover="prefetchOnMouseOver(rowData.id)" placement="left"
                            :message="`Edit Voucher ${rowData.id}`" color="primary">
                  <div>
                    <va-button class="mr-2" icon="edit" size="small" color="info"
                               @click="goToEditVoucher(rowData.id)"/>
                  </div>
                </va-popover>

                <va-popover v-if="rowData.status" placement="left" :message="`Deactivate Voucher ${rowData.id}`"
                            color="warning">
                  <div>
                    <va-button
                        icon="block"
                        size="small"
                        color="warning"
                        class="mr-2"
                        :loading="deactivateMutation.isPending.value && deactivateMutation.variables.value === rowData.id"
                        @click="handleDeactivateVoucher(rowData.id)"
                    />
                  </div>
                </va-popover>

                <va-popover placement="left" :message="`Delete Voucher ${rowData.id}`"
                            color="danger">
                  <div>
                    <va-button
                        icon="delete"
                        size="small"
                        color="danger"
                        :loading="deleteMutation.isPending.value && deleteMutation.variables.value === rowData.id"
                        @click="handleDeleteVoucher(rowData.id)"
                    />
                  </div>
                </va-popover>
              </div>
            </template>

            <template #bodyAppend v-if="filteredVouchers.length === 0">
              <tr>
                <td :colspan="columns.length" class="text-center py-16">
                  <div class="empty-state flex flex-col items-center justify-center">
                    <va-icon name="local_offer" size="large" class="mb-4 text-gray-400"/>
                    <h3 class="text-lg font-semibold text-gray-700 mb-2">No vouchers found</h3>
                    <p class="text-gray-500 mb-6 max-w-md text-center">
                      No vouchers match your current filters. Try changing your search criteria or clear filters.
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
                          @click="goToAddVoucher">
                        Add Voucher
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
.vouchers-page {
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

.vouchers-table {
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
  display: inline-flex;
}

.voucher-code {
  font-weight: 500;
  color: #374151;
}

.voucher-code.out-of-stock {
  color: #dc2626;
  font-weight: 600;
}

.discount-info {
  font-weight: 500;
}

.date-range {
  font-size: 0.875rem;
  color: #4B5563;
}

.expired-badge {
  font-size: 0.75rem;
  min-width: 45px;
  min-height: 20px;
  --va-badge-text-px: 0.35rem;
  --va-badge-text-py: 0.1rem;
}

.order-limits {
  font-size: 0.875rem;
  color: #4B5563;
}

.used-count {
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

.loading-container,
.error-container {
  min-height: 300px;
}

.items-per-page-select {
  width: 70px;
}

.date-input-group {
  min-width: 160px;
}

.date-input {
  width: 100%;
}

.date-filter-btn {
  height: 38px;
  display: flex;
  align-items: center;
}

.reset-button {
  min-width: 85px;
  height: 36px;
  background-color: #f3f4f6;
  border: 1px solid #e5e7eb;
}

.date-filter-container {
  animation: fadeIn 0.2s ease-in-out;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.date-filter-summary {
  font-size: 0.875rem;
}

.date-filter-summary .va-badge {
  padding: 0.25rem 0.5rem;
  font-weight: 500;
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

.out-of-stock-row {
  background-color: #fef2f2 !important;
  border-left: 4px solid #dc2626 !important;
}

.out-of-stock-row:hover {
  background-color: #fee2e2 !important;
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

@media (max-width: 640px) {
  .search-container,
  .filters-container {
    width: 100%;
  }

  .search-input,
  .filter-select,
  .date-filter-btn {
    width: 100%;
  }

  .filters-container {
    flex-direction: column;
    gap: 12px;
  }

  .date-filter-container .flex {
    flex-direction: column;
    gap: 12px;
  }

  .date-input-group,
  .date-actions {
    width: 100%;
  }

  .date-actions {
    width: 100%;
    display: flex;
    justify-content: space-between;
  }

  .date-actions .va-button,
  .reset-button {
    flex: 1;
    width: 100%;
  }

  .date-filter-summary {
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
</style>
