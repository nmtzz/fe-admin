<script setup>
import {useQuery} from "@tanstack/vue-query";
import {computed, ref} from "vue";
import axios from "axios";
import {useRouter} from "vue-router";
import {displayCurrency, formatDateTime} from "@/utils/localeUtil";

const router = useRouter();
const searchQuery = ref('');
const statusFilter = ref('all');
const typeFilter = ref('all');
const currentPage = ref(1);
const itemsPerPage = ref(10);

const sortBy = ref('createdAt');
const sortDir = ref('desc');

const {data: orders, isPending: isOrdersLoading, isError: isOrdersError} = useQuery({
  queryKey: ['orders'],
  queryFn: async () => {
    const {data} = await axios.get('/orders');
    return data?.result;
  }
});
const prefetchOnMouseOver = (orderId) => {
  if (queryClient.getQueryData([`orders/${orderId}`])) return;
  queryClient.prefetchQuery({
    queryKey: [`orders/${orderId}`],
    queryFn: async () => {
      const {data} = await axios.get(`/orders/${orderId}`)
      return data
    }
  })
}
const statusOptions = [
  {value: 'all', text: 'All Orders'},
  {value: 'UNPAID', text: 'Unpaid'},
  {value: 'PENDING_CONFIRMATION', text: 'Pending Confirmation'},
  {value: 'PENDING_SHIPPING', text: 'Pending Shipping'},
  {value: 'SHIPPING', text: 'Shipping'},
  {value: 'DELIVERED', text: 'Delivered'},
  {value: 'CANCELLED', text: 'Cancelled'},
  {value: 'PENDING_RETURN_CONFIRMATION', text: 'Pending Return'},
  {value: 'RETURNED', text: 'Returned'},
  {value: 'REJECTED_RETURN', text: 'Return Rejected'}
];

const typeOptions = [
  {value: 'all', text: 'All Types'},
  {value: 'ONLINE', text: 'Online Orders'},
  {value: 'POS', text: 'POS Orders'}
];

const getStatusColor = (status) => {
  const statusColors = {
    'UNPAID': 'warning',
    'PENDING_CONFIRMATION': 'info',
    'PENDING_SHIPPING': 'info',
    'SHIPPING': 'primary',
    'DELIVERED': 'success',
    'CANCELLED': 'danger',
    'PENDING_RETURN_CONFIRMATION': 'warning',
    'RETURNED': 'danger',
    'REJECTED_RETURN': 'danger'
  };
  return statusColors[status] || 'secondary';
};

const getPaymentMethodText = (method) => {
  const methodText = {
    'CASH_ON_DELIVERY': 'Cash on Delivery',
    'BANK_TRANSFER': 'Bank Transfer'
  };
  return methodText[method] || method;
};

const columns = [
  {key: 'orderCode', label: 'Order Code', sortable: true},
  {key: 'createdAt', label: 'Date', sortable: true},
  {key: 'recipientName', label: 'Customer', sortable: true},
  {key: 'totalAmount', label: 'Total', sortable: true},
  {key: 'status', label: 'Status', sortable: true},
  {key: 'paymentMethod', label: 'Payment', sortable: true},
  {key: 'actions', label: 'Actions'}
];

const sortOrders = (orders) => {
  if (!orders || !orders.length) return [];

  return [...orders].sort((a, b) => {
    let aVal = a[sortBy.value];
    let bVal = b[sortBy.value];

    if (sortBy.value === 'createdAt' || sortBy.value === 'updatedAt') {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    } else if (sortBy.value === 'totalAmount' || sortBy.value === 'subtotal' || sortBy.value === 'discountAmount') {
      aVal = parseFloat(aVal);
      bVal = parseFloat(bVal);
    } else {
      aVal = String(aVal).toLowerCase();
      bVal = String(bVal).toLowerCase();
    }

    return sortDir.value === 'desc'
        ? (aVal > bVal ? -1 : aVal < bVal ? 1 : 0)
        : (aVal < bVal ? -1 : aVal > bVal ? 1 : 0);
  });
};

const handleSort = (key) => {
  if (sortBy.value === key) {

    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
  } else {

    sortBy.value = key;
    sortDir.value = 'asc';
  }
};

const filteredOrders = computed(() => {
  if (!orders?.value) return [];

  let filtered = orders.value;

  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(order => order.status === statusFilter.value);
  }

  if (typeFilter.value !== 'all') {
    filtered = filtered.filter(order => {
      if (typeFilter.value === 'POS') {
        return order.type === 'POS';
      } else if (typeFilter.value === 'ONLINE') {
        return !order.type || order.type === 'ONLINE';
      }
      return true;
    });
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(order =>
        order.orderCode.toLowerCase().includes(query) ||
        order.recipientName.toLowerCase().includes(query) ||
        order.phoneNumber.toLowerCase().includes(query)
    );
  }

  return sortOrders(filtered);
});

const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredOrders.value.slice(start, end);
});

const totalPages = computed(() =>
    Math.ceil(filteredOrders.value.length / itemsPerPage.value)
);

const goToOrderDetail = (orderId) => {
  router.push(`/orders/${orderId}`);
};

const resetFilters = () => {
  searchQuery.value = '';
  statusFilter.value = 'all';
  typeFilter.value = 'all';
  currentPage.value = 1;
};
</script>

<template>
  <div class="orders-list-page">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-800">Orders</h1>
    </div>

    <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
      <div class="flex flex-wrap gap-4 items-end">

        <div class="search-container flex-grow">
          <label class="block text-sm font-medium text-gray-600 mb-1">Search</label>
          <va-input
              v-model="searchQuery"
              placeholder="Search by order code, customer name or phone"
              class="search-input"
          >
            <template #appendInner>
              <va-icon name="search"/>
            </template>
          </va-input>
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

        <div class="type-filter">
          <label class="block text-sm font-medium text-gray-600 mb-1">Type</label>
          <va-select
              v-model="typeFilter"
              :options="typeOptions"
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

    <div v-if="isOrdersLoading" class="loading-container flex items-center justify-center">
      <VaInnerLoading loading color="primary">
        <va-icon name="hourglass_empty" size="large"/>
      </VaInnerLoading>
    </div>

    <div v-else-if="isOrdersError" class="error-container">
      <div class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 mb-6">
        <va-icon name="error_outline" class="mr-2"/>
        Error loading orders. Please try again or contact support.
      </div>
    </div>

    <div v-else-if="filteredOrders.length === 0"
         class="empty-state bg-white p-8 rounded-lg border border-gray-200 text-center">
      <va-icon name="inbox" size="large" class="text-gray-400 mb-4"/>
      <h3 class="text-lg font-semibold text-gray-700">No Orders Found</h3>
      <p class="text-gray-500 mt-2">
        {{ searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters' : 'There are no orders to display' }}
      </p>
    </div>

    <div v-else class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <va-data-table
          :items="paginatedOrders"
          :columns="columns"
          striped
          hoverable
          class="w-full orders-table custom-alignment-table"
      >

        <template #head(orderCode)="{ column }">
          <div
              class="cursor-pointer flex items-center"
              @click="handleSort('orderCode')"
          >
            {{ column.label }}
            <va-icon
                v-if="sortBy === 'orderCode'"
                :name="sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward'"
                size="small"
                class="ml-1"
            />
          </div>
        </template>

        <template #head(createdAt)="{ column }">
          <div
              class="cursor-pointer flex items-center"
              @click="handleSort('createdAt')"
          >
            {{ column.label }}
            <va-icon
                v-if="sortBy === 'createdAt'"
                :name="sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward'"
                size="small"
                class="ml-1"
            />
          </div>
        </template>

        <template #head(recipientName)="{ column }">
          <div
              class="cursor-pointer flex items-center"
              @click="handleSort('recipientName')"
          >
            {{ column.label }}
            <va-icon
                v-if="sortBy === 'recipientName'"
                :name="sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward'"
                size="small"
                class="ml-1"
            />
          </div>
        </template>

        <template #head(totalAmount)="{ column }">
          <div
              class="cursor-pointer flex items-center"
              @click="handleSort('totalAmount')"
          >
            {{ column.label }}
            <va-icon
                v-if="sortBy === 'totalAmount'"
                :name="sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward'"
                size="small"
                class="ml-1"
            />
          </div>
        </template>

        <template #head(status)="{ column }">
          <div
              class="cursor-pointer flex items-center"
              @click="handleSort('status')"
          >
            {{ column.label }}
            <va-icon
                v-if="sortBy === 'status'"
                :name="sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward'"
                size="small"
                class="ml-1"
            />
          </div>
        </template>

        <template #head(paymentMethod)="{ column }">
          <div
              class="cursor-pointer flex items-center"
              @click="handleSort('paymentMethod')"
          >
            {{ column.label }}
            <va-icon
                v-if="sortBy === 'paymentMethod'"
                :name="sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward'"
                size="small"
                class="ml-1"
            />
          </div>
        </template>

        <template #cell(orderCode)="{ rowData }">
          <div class="flex items-center">
            <div class="font-medium text-primary">{{ rowData.orderCode }}</div>
            <va-badge v-if="rowData.type === 'POS'"
                      text="POS"
                      color="info"
                      size="small"
                      class="ml-2"/>
          </div>
        </template>

        <template #cell(createdAt)="{ rowData }">
          <div>{{ formatDateTime(rowData.createdAt) }}</div>
        </template>

        <template #cell(recipientName)="{ rowData }">
          <div class="customer-info">
            <div class="font-medium">{{ rowData.recipientName }}</div>
            <div class="text-xs text-gray-500">{{ rowData.phoneNumber }}</div>
          </div>
        </template>

        <template #cell(totalAmount)="{ rowData }">
          <div class="font-medium">{{ displayCurrency(rowData.totalAmount) }}</div>
          <div v-if="rowData.discountAmount > 0" class="text-xs text-green-600">
            -{{ displayCurrency(rowData.discountAmount) }}
          </div>
        </template>

        <template #cell(status)="{ rowData }">
          <va-badge
              :text="rowData.status"
              :color="getStatusColor(rowData.status)"
              class="status-badge"
          />
          <div v-if="rowData.needRefund" class="text-xs text-red-500 mt-1">
            <va-icon name="payments" size="x-small" class="mr-1"/>
            Refund Needed
          </div>
        </template>

        <template #cell(paymentMethod)="{ rowData }">
          <div>{{ getPaymentMethodText(rowData.paymentMethod) }}</div>
        </template>

        <template #cell(actions)="{ rowData }">
          <div class="flex items-center">
            <va-button
                @mouseover="prefetchOnMouseOver(rowData.id)"
                icon="visibility"
                size="small"
                color="info"
                @click="goToOrderDetail(rowData.id)"
            />
          </div>
        </template>
      </va-data-table>

      <div class="pagination-controls flex items-center justify-between p-4 border-t border-gray-200">
        <div class="text-sm text-gray-500">
          Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to
          {{ Math.min(currentPage * itemsPerPage, filteredOrders.length) }} of
          {{ filteredOrders.length }} orders
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
</template>

<style scoped>
.orders-list-page {
  animation: fadeIn 0.3s ease-in-out;
}

.status-badge {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.25rem 0.5rem;
}

.loading-container,
.error-container {
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

@media (max-width: 768px) {
  .search-container,
  .status-filter,
  .type-filter {
    width: 100%;
  }

  .pagination-controls {
    flex-direction: column;
    gap: 1rem;
  }

  .pagination-controls > div {
    width: 100%;
    justify-content: center;
  }
}
</style>
