<template>
  <div class="list-promotion-page">

    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold">Promotions</h1>
        <p class="text-gray-600 mt-1">Manage your promotional discounts</p>
      </div>
      <div class="flex space-x-2">
        <va-button
            color="primary"
            icon="add"
            @click="$router.push('/promotions/add')"
        >
          Add Promotion
        </va-button>
      </div>
    </div>

    <div class="bg-white p-4 rounded-lg shadow-sm mb-6">
      <div class="flex flex-wrap gap-4 items-end">

        <va-input
            v-model="searchQuery"
            placeholder="Search promotions..."
            icon="search"
            class="search-input"
        />

        <va-select
            v-model="statusFilter"
            :options="statusOptions"
            text-by="text"
            value-by="value"
            label="Status"
            class="filter-select"
        />

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
          <div class="flex items-center gap-2">
            <va-date-input
                v-model="dateFilter.startDate"
                placeholder="Start date"
                :format-date="formatDate"
                :parse-date="parseDate"
                class="date-input"
            />
            <span class="text-gray-500">to</span>
            <va-date-input
                v-model="dateFilter.endDate"
                placeholder="End date"
                :format-date="formatDate"
                :parse-date="parseDate"
                class="date-input"
            />
          </div>
        </div>

        <va-button
            icon="restart_alt"
            preset="secondary"
            @click="resetFilters"
            class="reset-button"
        >
          Reset
        </va-button>
      </div>
    </div>

    <va-card class="mb-6">
      <va-card-content>
        <div v-if="isPromotionsError" class="error-container py-8 flex flex-col items-center justify-center">
          <va-icon name="error_outline" size="large" color="danger"/>
          <p class="mt-4 text-gray-600">Failed to load promotions. Please try again later.</p>
          <va-button class="mt-4" @click="refetchPromotions">Retry</va-button>
        </div>

        <div v-else>
          <va-data-table
              :items="filteredPromotions"
              :columns="promotionColumns"
              :loading="isPromotionsLoading"
              striped
              hoverable
              class="promotions-table"
              :row-class="(rowData) => isPromotionExpired(rowData) ? 'expired-row' : ''"
          >

            <template #cell(name)="{ rowData }">
              <div class="font-medium"
                   :class="isPromotionExpired(rowData) ? 'text-red-600 expired-name' : 'text-primary'">
                {{ rowData.name }}
                <va-badge
                    v-if="isPromotionExpired(rowData)"
                    text="Expired"
                    color="danger"
                    class="expired-badge ml-2"
                />
              </div>
            </template>

            <template #cell(discountPercentage)="{ rowData }">
              <va-badge color="success">
                {{ rowData.discountPercentage }}%
              </va-badge>
            </template>

            <template #cell(dateRange)="{ rowData }">
              <div class="flex flex-col">
                <span class="text-xs text-gray-500">Start: {{ displayDate(rowData.startDate) }}</span>
                <span class="text-xs text-gray-500">End: {{ displayDate(rowData.endDate) }}</span>
              </div>
            </template>

            <template #cell(status)="{ rowData }">
              <va-badge :color="getStatusColor(rowData)">
                {{ getStatus(rowData) }}
              </va-badge>
            </template>

            <template #cell(productCount)="{ rowData }">
              <div>
                {{ rowData.productCount || 0 }}
              </div>
            </template>

            <template #cell(actions)="{ rowData }">
              <div class="flex items-center space-x-2">
                <va-button
                    icon="edit"
                    size="small"
                    color="primary"
                    flat
                    @mouseover="prefetchOnMouseOver(rowData.id)"
                    @click="editPromotion(rowData)"
                />
                <va-button
                    icon="delete_outline"
                    size="small"
                    color="danger"
                    flat
                    @click="confirmDelete(rowData)"
                />
              </div>
            </template>

            <template #bodyAppend v-if="filteredPromotions.length === 0 && !isPromotionsLoading">
              <tr>
                <td :colspan="promotionColumns.length" class="text-center py-8">
                  <div class="empty-state flex flex-col items-center justify-center">
                    <va-icon name="campaign" size="large" class="mb-4 text-gray-400"/>
                    <p v-if="searchQuery || statusFilter !== 'all' || dateFilter.startDate || dateFilter.endDate"
                       class="text-gray-500 mb-4">
                      No promotions match your filters
                    </p>
                    <p v-else class="text-gray-500 mb-4">
                      No promotions found
                    </p>
                    <va-button
                        color="primary"
                        icon="add"
                        @click="$router.push('/promotions/add')"
                    >
                      Add Your First Promotion
                    </va-button>
                  </div>
                </td>
              </tr>
            </template>
          </va-data-table>
        </div>
      </va-card-content>
    </va-card>

    <va-modal
        v-model="showDeleteModal"
        title="Delete Promotion"
        message="Are you sure you want to delete this promotion? This action cannot be undone."
        ok-text="Delete"
        cancel-text="Cancel"
        @ok="deletePromotion"
    >
      <template #default>
        <p class="mb-4">
          <strong>Promotion:</strong> {{ promotionToDelete?.name }}
        </p>
        <p class="text-danger">
          This will remove the promotion from all associated products.
        </p>
      </template>
    </va-modal>
  </div>
</template>

<script setup>
import {computed, ref} from "vue";
import {useMutation, useQuery, useQueryClient} from "@tanstack/vue-query";
import {useToast} from "vuestic-ui";
import {useRouter} from "vue-router";
import axios from "axios";
import {displayDate, formatDate, parseDate} from "@/utils/localeUtil.js";

const router = useRouter();
const {notify} = useToast();
const queryClient = useQueryClient();

const searchQuery = ref("");
const statusFilter = ref("all");
const dateFilter = ref({
  startDate: null,
  endDate: null
});

const statusOptions = [
  {text: "All", value: "all"},
  {text: "Active", value: "active"},
  {text: "Upcoming", value: "upcoming"},
  {text: "Expired", value: "expired"}
];

const showDeleteModal = ref(false);
const promotionToDelete = ref(null);

const promotionColumns = [
  {
    key: "name",
    label: "Promotion Name",
    sortable: true
  },
  {
    key: "discountPercentage",
    label: "Discount",
    sortable: true
  },
  {
    key: "dateRange",
    label: "Date Range",
    sortable: false
  },
  {
    key: "status",
    label: "Status",
    sortable: true
  },
  {
    key: "productCount",
    label: "Products",
    sortable: true
  },
  {
    key: "actions",
    label: "Actions",
    sortable: false,
    width: "80px"
  }
];

const {
  data: promotions,
  isPending: isPromotionsLoading,
  isError: isPromotionsError,
  refetch: refetchPromotions
} = useQuery({
  queryKey: ["promotions"],
  queryFn: async () => {
    const {data} = await axios.get("/promotions");
    return data.result;
  }
});

const filteredPromotions = computed(() => {
  if (!promotions.value) return [];

  let filtered = [...promotions.value];

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(promotion =>
        promotion.name.toLowerCase().includes(query)
    );
  }

  if (statusFilter.value !== "all") {
    const now = new Date();

    filtered = filtered.filter(promotion => {
      const startDate = new Date(promotion.startDate);
      const endDate = new Date(promotion.endDate);

      switch (statusFilter.value) {
        case "active":
          return startDate <= now && endDate >= now;
        case "upcoming":
          return startDate > now;
        case "expired":
          return endDate < now;
        default:
          return true;
      }
    });
  }

  if (dateFilter.value.startDate) {
    const filterStartDate = new Date(dateFilter.value.startDate);
    filtered = filtered.filter(promotion => {
      const promotionEndDate = new Date(promotion.endDate);
      return promotionEndDate >= filterStartDate;
    });
  }

  if (dateFilter.value.endDate) {
    const filterEndDate = new Date(dateFilter.value.endDate);
    filtered = filtered.filter(promotion => {
      const promotionStartDate = new Date(promotion.startDate);
      return promotionStartDate <= filterEndDate;
    });
  }

  return filtered;
});

const getStatus = (promotion) => {
  const now = new Date();
  const startDate = new Date(promotion.startDate);
  const endDate = new Date(promotion.endDate);

  if (startDate > now) {
    return "Upcoming";
  } else if (endDate < now) {
    return "Expired";
  } else {
    return "Active";
  }
};

const getStatusColor = (promotion) => {
  const status = getStatus(promotion);
  switch (status) {
    case "Active":
      return "success";
    case "Upcoming":
      return "info";
    case "Expired":
      return "danger";
    default:
      return "gray";
  }
};

const isPromotionExpired = (promotion) => {
  return getStatus(promotion) === "Expired";
};

const resetFilters = () => {
  searchQuery.value = "";
  statusFilter.value = "all";
  dateFilter.value = {
    startDate: null,
    endDate: null
  };
};

const prefetchOnMouseOver = (promotionId) => {
  if (queryClient.getQueryData([`promotions/${promotionId}`])) return;
  queryClient.prefetchQuery({
    queryKey: [`promotions/${promotionId}`],
    queryFn: async () => {
      const {data} = await axios.get(`/promotions/${promotionId}`)
      return data
    }
  })
}

const editPromotion = (promotion) => {
  router.push(`/promotions/${promotion.id}`);
};

const confirmDelete = (promotion) => {
  promotionToDelete.value = promotion;
  showDeleteModal.value = true;
};

const deleteMutation = useMutation({
  mutationFn: async (id) => {
    return await axios.delete(`/promotions/${id}`);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({queryKey: ["promotions"]});
    queryClient.invalidateQueries([`promotions/${promotionToDelete.value.id}`])
    queryClient.resetQueries([`promotions/${promotionToDelete.value.id}`])
    queryClient.removeQueries([`promotions/${promotionToDelete.value.id}`])
    notify({
      message: "Promotion deleted successfully",
      color: "success"
    });
    showDeleteModal.value = false;
  },
  onError: (error) => {
    notify({
      message: `Failed to delete promotion: ${error.response?.data?.message || error.message}`,
      color: "danger"
    });
  }
});

const deletePromotion = () => {
  if (promotionToDelete.value) {
    deleteMutation.mutate(promotionToDelete.value.id);
  }
};
</script>

<style scoped>
.list-promotion-page {
  animation: fadeIn 0.3s ease-in-out;
}

.search-input {
  min-width: 250px;
}

.filter-select {
  min-width: 150px;
}

.date-input {
  width: 130px;
}

.reset-button {
  height: 38px;
}

.promotions-table {
  width: 100%;
}

.expired-name {
  font-weight: 600;
}

.expired-badge {
  font-size: 0.75rem;
  min-width: 60px;
  min-height: 18px;
  --va-badge-text-px: 0.35rem;
  --va-badge-text-py: 0.1rem;
  font-weight: 600;
}

.expired-row {
  background-color: #fef2f2 !important;
  border-left: 4px solid #dc2626 !important;
}

.expired-row:hover {
  background-color: #fee2e2 !important;
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
</style>
