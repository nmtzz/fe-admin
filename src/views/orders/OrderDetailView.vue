<script setup>
import {useRoute} from "vue-router";
import {useMutation, useQuery, useQueryClient} from "@tanstack/vue-query";
import {computed, ref} from "vue";
import axios from "axios";
import {displayCurrency, formatDateTime} from "@/utils/localeUtil";
import {useModal, useToast} from "vuestic-ui";

const {notify} = useToast()
const {confirm} = useModal()

const route = useRoute();
const orderId = route.params.orderId;
const queryClient = useQueryClient()

const showReturnModal = ref(false);
const showCancelModal = ref(false);
const showRejectReturnModal = ref(false);
const cancelReason = ref('');
const rejectReturnReason = ref('');

const {data: orderDetail, isPending: isOrderDetailLoading, isError: isOrderDetailError} = useQuery({
  queryKey: [`orders/${orderId}`],
  queryFn: async () => {
    const {data} = await axios.get(`/orders/${orderId}`);
    return data?.result;
  },
  enabled: computed(() => !!route.params.orderId)
});

const columns = [
  {key: 'product', label: 'Product'},
  {key: 'priceAtPurchase', label: 'Price'},
  {key: 'quantity', label: 'Quantity', width: '100px'},
  {key: 'subtotal', label: 'Subtotal', width: '150px'}
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

const getStatusText = (status) => {
  const statusText = {
    'UNPAID': 'Unpaid',
    'PENDING_CONFIRMATION': 'Pending Confirmation',
    'PENDING_SHIPPING': 'Pending Shipping',
    'SHIPPING': 'Shipping',
    'DELIVERED': 'Delivered',
    'CANCELLED': 'Cancelled',
    'PENDING_RETURN_CONFIRMATION': 'Pending Return',
    'RETURNED': 'Returned',
    'REJECTED_RETURN': 'Return Rejected'
  };
  return statusText[status] || status;
};

const getPaymentMethodText = (method) => {
  const methodText = {
    'CASH_ON_DELIVERY': 'Cash on Delivery',
    'BANK_TRANSFER': 'Bank Transfer'
  };
  return methodText[method] || method;
};

const orderStatusProgressionSteps = [
  {status: 'PENDING_CONFIRMATION', label: 'Confirmed', activeColor: '#6366F1'},
  {status: 'PENDING_SHIPPING', label: 'Processing', activeColor: '#8B5CF6'},
  {status: 'SHIPPING', label: 'Shipping', activeColor: '#EC4899'},
  {status: 'DELIVERED', label: 'Delivered', activeColor: '#10B981'}
];
const getCurrentProgressStep = (status) => {
  if (status === 'CANCELLED') return -1;
  if (status === 'UNPAID') return 0;

  const index = orderStatusProgressionSteps.findIndex(step => step.status === status);
  return index !== -1 ? index + 1 : 0;
};
const getNextStatus = (status) => {
  const statusMapping = {
    'UNPAID': 'PENDING_CONFIRMATION',
    'PENDING_CONFIRMATION': 'PENDING_SHIPPING',
    'PENDING_SHIPPING': 'SHIPPING',
    'SHIPPING': 'DELIVERED'
  };
  return statusMapping[status] || null;
};

const isInNormalProgression = (status) => {
  return status === 'UNPAID' ||
      orderStatusProgressionSteps.some(step => step.status === status);
};
const {data: returnRequest, isPending: isReturnRequestLoading, isError: isReturnRequestError} = useQuery({
  queryKey: [`returns/${orderId}`],
  queryFn: async () => {
    const {data} = await axios.get(`/returns/${orderId}`);
    return data?.result;
  },
  enabled: computed(() => !!route.params.orderId && ['PENDING_RETURN_CONFIRMATION', 'RETURNED', 'REJECTED_RETURN'].includes(orderDetail?.value?.status))
})
const changeStatusMutation = useMutation({
  mutationFn: async (status) => {
    const {data} = await axios.patch(`/orders/update-status/${orderId}?status=${status}`);
    return data?.success;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({queryKey: [`orders/${orderId}`]});
    notify({
      message: 'Order status updated successfully',
      color: 'success',
    });
  },
  onError: (error) => {
    notify({
      message: 'Failed to update order status',
      color: 'danger',
    });
  }
})
const {data: refundData, isPending: isRefundLoading, isError: isRefundError} = useQuery({
  queryKey: [`refunds/${orderId}`],
  queryFn: async () => {
    const {data} = await axios.get(`orders/refund/${orderId}`);
    console.log(data?.result)
    return data?.result;
  },
  enabled: computed(() => !!route.params.orderId && orderDetail?.value?.status === 'CANCELLED' && orderDetail?.value?.paymentMethod === 'BANK_TRANSFER')
})
const confirmRefundMutation = useMutation({
  mutationFn: async () => {
    if (!refundData.value || !refundData.value.id) {
      throw new Error('Refund data not available');
    }
    const {data} = await axios.patch(`/orders/confirm-refund/${refundData.value.id}`);
    return data?.success;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({queryKey: [`orders/${orderId}`]});
    queryClient.invalidateQueries({queryKey: [`refunds/${orderId}`]});
    notify({
      message: 'Refund confirmed successfully',
      color: 'success',
    });
  },
  onError: (error) => {
    notify({
      message: 'Failed to confirm refund: ' + (error.response?.data?.message || error.message || 'Unknown error'),
      color: 'danger',
    });
  }
});

const cancelOrderMutation = useMutation({
  mutationFn: async (reason) => {
    const {data} = await axios.put(`/orders/cancel/${orderId}?reason=${encodeURIComponent(reason || '')}`);
    return data?.success;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({queryKey: [`orders/${orderId}`]});
    showCancelModal.value = false;
    cancelReason.value = '';
    notify({
      message: 'Order cancelled successfully',
      color: 'success',
    });
  },
  onError: (error) => {
    notify({
      message: 'Failed to cancel order: ' + (error.response?.data?.message || 'Unknown error'),
      color: 'danger',
    });
  }
});

const handleUpdateStatus = (status) => {
  console.log(status)

  if (status === 'SHIPPING' && shouldShowStockConfirmation.value) {
    handleShippingWithStockIssues();
    return;
  }

  confirm({
    title: 'Update Order Status',
    message: 'Are you sure you want to update the order status?',
    okText: 'Update',
    cancelText: 'Cancel',
    child: {
      okButton: {
        color: 'primary'
      }
    }
  }).then((confirmed) => {
    if (confirmed) {
      changeStatusMutation.mutate(status);
    }
  });
}

const handleShippingWithStockIssues = () => {
  const outOfStockCount = outOfStockProducts.value.length;
  const outOfStockNames = outOfStockProducts.value.map(item => item.productName).join(', ');

  confirm({
    title: 'Stock Issue Detected',
    message: `${outOfStockCount} product(s) are out of stock: ${outOfStockNames}. What would you like to do?`,
    okText: 'Remove & Ship',
    cancelText: 'Cancel Order',
    child: {
      okButton: {
        color: 'primary'
      },
      cancelButton: {
        color: 'danger'
      }
    }
  }).then((confirmed) => {
    if (confirmed) {

      changeStatusMutation.mutate('SHIPPING');
    } else {

      handleCancelOrder();
    }
  });
};

const getNextStatusButtonText = (status) => {
  const statusButtonText = {
    'UNPAID': 'Confirm Payment',
    'PENDING_CONFIRMATION': 'Confirm Order',
    'PENDING_SHIPPING': 'Confirm Shipping',
    'SHIPPING': 'Mark as Delivered'
  };
  return statusButtonText[status] || 'Update Status';
};

const acceptReturnMutation = useMutation({
  mutationFn: async () => {
    const {data} = await axios.put(`/returns/accept/${orderId}`);
    return data?.success;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({queryKey: [`orders/${orderId}`]});
    queryClient.invalidateQueries({queryKey: [`returns/${orderId}`]});
    notify({
      message: 'Return request accepted successfully',
      color: 'success',
    });
  },
  onError: (error) => {
    notify({
      message: 'Failed to accept return request: ' + (error.response?.data?.message || 'Unknown error'),
      color: 'danger',
    });
  }
});

const rejectReturnMutation = useMutation({
  mutationFn: async (reason) => {
    const {data} = await axios.put(`/returns/reject/${orderId}?reason=${encodeURIComponent(reason || '')}`);
    return data?.success;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({queryKey: [`orders/${orderId}`]});
    queryClient.invalidateQueries({queryKey: [`returns/${orderId}`]});
    showRejectReturnModal.value = false;
    rejectReturnReason.value = '';
    notify({
      message: 'Return request rejected successfully',
      color: 'success',
    });
  },
  onError: (error) => {
    notify({
      message: 'Failed to reject return request: ' + (error.response?.data?.message || 'Unknown error'),
      color: 'danger',
    });
  }
});

const handleConfirmRefund = () => {
  confirm({
    title: 'Confirm Refund',
    message: 'Are you sure you want to mark this refund as completed? This action cannot be undone.',
    okText: 'Confirm',
    cancelText: 'Cancel',
    child: {
      okButton: {
        color: 'success'
      }
    }
  }).then((confirmed) => {
    if (confirmed) {
      confirmRefundMutation.mutate();
    }
  });
};

const handleAcceptReturn = () => {
  confirm({
    title: 'Accept Return Request',
    message: 'Are you sure you want to accept this return request? This will update the order status to RETURNED.',
    okText: 'Accept',
    cancelText: 'Cancel',
    child: {
      okButton: {
        color: 'success'
      }
    }
  }).then((confirmed) => {
    if (confirmed) {
      acceptReturnMutation.mutate();
    }
  });
};

const handleRejectReturn = () => {
  showRejectReturnModal.value = true;
};

const confirmRejectReturn = () => {
  rejectReturnMutation.mutate(rejectReturnReason.value);
};

const handleCancelOrder = () => {
  showCancelModal.value = true;
};

const confirmCancelOrder = () => {
  cancelOrderMutation.mutate(cancelReason.value);
};

const currentStep = computed(() => {
  if (!orderDetail.value) return 0;

  const statusToStepMap = {
    'UNPAID': 0,
    'PENDING_CONFIRMATION': 0,
    'PENDING_SHIPPING': 1,
    'SHIPPING': 2,
    'DELIVERED': 3,
    'CANCELLED': -1,
    'PENDING_RETURN_CONFIRMATION': -1,
    'RETURNED': -1,
    'REJECTED_RETURN': -1
  };

  return statusToStepMap[orderDetail.value.status] || 0;
});

const steps = [
  {label: 'Confirmed', icon: 'check_circle'},
  {label: 'Processing', icon: 'local_shipping'},
  {label: 'Shipping', icon: 'local_shipping'},
  {label: 'Delivered', icon: 'done_all'}
];

const areAllProductsOutOfStock = computed(() => {
  if (!orderDetail.value || !orderDetail.value.orderDetails) return false;

  return orderDetail.value.orderDetails.every(item => item.currentStock <= 0);
});

const hasOutOfStockProducts = computed(() => {
  if (!orderDetail.value || !orderDetail.value.orderDetails) return false;

  return orderDetail.value.orderDetails.some(item => item.currentStock <= 0);
});

const outOfStockProducts = computed(() => {
  if (!orderDetail.value || !orderDetail.value.orderDetails) return [];

  return orderDetail.value.orderDetails.filter(item => item.currentStock <= 0);
});

const shouldHideNextStatusButton = computed(() => {
  if (!orderDetail.value) return false;

  const nextStatus = getNextStatus(orderDetail.value.status);
  return nextStatus === 'SHIPPING' && areAllProductsOutOfStock.value;
});

const shouldShowStockConfirmation = computed(() => {
  if (!orderDetail.value) return false;

  const nextStatus = getNextStatus(orderDetail.value.status);
  return nextStatus === 'SHIPPING' && hasOutOfStockProducts.value && !areAllProductsOutOfStock.value;
});

const hasExcessQuantityItems = computed(() => {
  if (!orderDetail.value || !orderDetail.value.orderDetails) return false;

  return orderDetail.value.orderDetails.some(item => item.quantity > item.currentStock && item.currentStock > 0);
});

const excessQuantityItems = computed(() => {
  if (!orderDetail.value || !orderDetail.value.orderDetails) return [];

  return orderDetail.value.orderDetails.filter(item => item.quantity > item.currentStock && item.currentStock > 0);
});

const shouldShowStockAlert = computed(() => {
  if (!orderDetail.value) return false;

  const showForStatuses = ['PENDING_CONFIRMATION', 'PENDING_SHIPPING'];
  return showForStatuses.includes(orderDetail.value.status) &&
         (hasExcessQuantityItems.value || hasOutOfStockProducts.value);
});
</script>

<template>
  <div class="order-detail-page">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-800">Order Details</h1>
      <va-button icon="arrow_back" color="secondary" flat @click="$router.back()">Back</va-button>
    </div>

    <div v-if="isOrderDetailLoading" class="loading-container flex items-center justify-center">
      <VaInnerLoading loading color="primary">
        <va-icon name="hourglass_empty" size="large"/>
      </VaInnerLoading>
    </div>

    <div v-else-if="isOrderDetailError" class="error-container">
      <div class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 mb-6">
        <va-icon name="error_outline" class="mr-2"/>
        Error loading order details. Please try again or contact support.
      </div>
    </div>

    <div v-else-if="orderDetail" class="order-content">

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        <div class="lg:col-span-2">
          <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div class="flex justify-between items-start mb-4">
              <div>
                <h2 class="text-xl font-semibold text-gray-800 mb-1">Order #{{ orderDetail.orderCode }}</h2>
                <div class="text-sm text-gray-500">
                  Created: {{ formatDateTime(orderDetail.createdAt) }}
                </div>
              </div>
              <va-badge :text="getStatusText(orderDetail.status)" :color="getStatusColor(orderDetail.status)"
                        class="status-badge"/>
            </div>

            <div v-if="shouldShowStockAlert" class="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div class="flex items-start">
                <va-icon name="warning" class="text-yellow-600 mr-3 mt-1" size="medium"/>
                <div class="flex-1">
                  <h3 class="text-yellow-800 font-semibold mb-2">Stock Availability Notice</h3>

                  <div v-if="hasExcessQuantityItems" class="mb-3">
                    <p class="text-yellow-700 text-sm mb-2">
                      The following items have quantities that exceed current stock. Quantities will be adjusted to available stock:
                    </p>
                    <div class="space-y-1">
                      <div v-for="item in excessQuantityItems" :key="item.id" class="text-sm">
                        <span class="font-medium text-yellow-800">{{ item.productName }}</span>
                        <span class="text-yellow-600"> - Ordered: {{ item.quantity }}, Available: {{ item.currentStock }}</span>
                      </div>
                    </div>
                  </div>

                  <div v-if="hasOutOfStockProducts" class="mb-3">
                    <p class="text-yellow-700 text-sm mb-2">
                      The following items are completely out of stock and will be removed from the order:
                    </p>
                    <div class="space-y-1">
                      <div v-for="item in outOfStockProducts" :key="item.id" class="text-sm">
                        <span class="font-medium text-yellow-800">{{ item.productName }}</span>
                        <span class="text-yellow-600"> - Out of Stock</span>
                      </div>
                    </div>
                  </div>

                  <p class="text-yellow-700 text-sm font-medium mt-3">
                    Please review these changes or consider cancelling the order if the adjustments are not acceptable.
                  </p>
                </div>
              </div>
            </div>

            <div v-if="orderDetail.status === 'UNPAID' && orderDetail.paymentMethod === 'BANK_TRANSFER'" class="mb-4">
              <va-button
                  color="#6366F1"
                  class="status-update-button"
                  @click="handleUpdateStatus(getNextStatus(orderDetail.status))"
                  :loading="changeStatusMutation.isPending.value"
              >
                <va-icon name="arrow_forward" class="mr-2"/>
                {{ getNextStatusButtonText(orderDetail.status) }}
              </va-button>
            </div>

            <div
                v-else-if="isInNormalProgression(orderDetail.status) && orderDetail.status !== 'UNPAID' && orderDetail.status !== 'DELIVERED' && orderDetail.type !== 'POS' && !shouldHideNextStatusButton"
                class="mb-4">

              <div v-if="shouldShowStockConfirmation" class="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div class="flex items-center text-orange-800">
                  <va-icon name="inventory_2" class="mr-2"/>
                  <span class="font-medium">{{ outOfStockProducts.length }} product(s) are out of stock. Proceeding will remove them from the order.</span>
                </div>
              </div>

              <va-button
                  :color="getCurrentProgressStep(orderDetail.status) === 1 ? '#6366F1' :
                        getCurrentProgressStep(orderDetail.status) === 2 ? '#8B5CF6' :
                        getCurrentProgressStep(orderDetail.status) === 3 ? '#EC4899' : '#10B981'"
                  class="status-update-button"
                  @click="handleUpdateStatus(getNextStatus(orderDetail.status))"
                  :loading="changeStatusMutation.isPending.value"
              >
                <va-icon name="arrow_forward" class="mr-2"/>
                {{ getNextStatusButtonText(orderDetail.status) }}
              </va-button>
            </div>

            <div v-if="shouldHideNextStatusButton" class="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div class="flex items-center text-yellow-800">
                <va-icon name="warning" class="mr-2"/>
                <span
                    class="font-medium">Cannot proceed to shipping: All products in this order are out of stock.</span>
              </div>
            </div>

            <div
                v-if="orderDetail.status === 'UNPAID' || orderDetail.status === 'PENDING_CONFIRMATION' || orderDetail.status === 'PENDING_SHIPPING'"
                class="mb-4">
              <va-button
                  color="danger"
                  class="cancel-order-button"
                  @click="handleCancelOrder"
                  :loading="cancelOrderMutation.isPending.value"
              >
                <va-icon name="cancel" class="mr-2"/>
                Cancel Order
              </va-button>
            </div>

            <div v-if="isInNormalProgression(orderDetail.status) && orderDetail.type !== 'POS'" class="my-6">
              <va-stepper
                  v-model="currentStep"
                  :steps="steps"
                  :controls-hidden="true"
                  :navigation-disabled="true"
              >

                <template v-for="(step, index) in steps" :key="index"
                          #[`stepButton-${index}`]="{ isActive, isCompleted }">
                  <div class="custom-step" :class="{
                    'active': isActive,
                    'completed': isCompleted || index < currentStep,
                    'pending': !isActive && !isCompleted && index > currentStep
                  }">
                    <div class="step-marker" :style="{
                      'background-color': isActive ? getStepColor(index) : (isCompleted || index < currentStep) ? '#6366F1' : 'white',
                      'border-color': isActive ? getStepColor(index) : (isCompleted || index < currentStep) ? '#6366F1' : '#e5e7eb',
                      'color': isActive || isCompleted || index < currentStep ? 'white' : '#6b7280'
                    }">
                      <va-icon v-if="isCompleted || index < currentStep" name="check"/>
                      <span v-else>{{ index + 1 }}</span>
                    </div>
                    <div class="step-label" :style="{
                      'color': isActive ? getStepColor(index) : (isCompleted || index < currentStep) ? '#6366F1' : '#6b7280',
                      'font-weight': isActive || isCompleted || index < currentStep ? '600' : '500'
                    }">
                      {{ step.label }}
                    </div>
                  </div>
                </template>
              </va-stepper>
            </div>

            <div v-if="!isInNormalProgression(orderDetail.status) && orderDetail.status !== 'UNPAID'"
                 class="my-6 p-4 rounded-lg" :class="{
              'bg-red-50 border border-red-200 text-red-800': orderDetail.status === 'CANCELLED' || orderDetail.status === 'RETURNED' || orderDetail.status === 'REJECTED_RETURN',
              'bg-yellow-50 border border-yellow-200 text-yellow-800': orderDetail.status === 'PENDING_RETURN_CONFIRMATION'
            }">
              <div class="flex items-start">
                <va-icon
                    :name="orderDetail.status === 'PENDING_RETURN_CONFIRMATION' ? 'assignment_return' : 'error_outline'"
                    class="mr-2 mt-1"/>
                <div class="flex-1">
                  <div class="font-medium mb-2">
                  {{
                    orderDetail.status === 'CANCELLED' ? 'This order has been cancelled' :
                        orderDetail.status === 'RETURNED' ? 'This order has been returned' :
                            orderDetail.status === 'REJECTED_RETURN' ? 'Return request has been rejected' :
                                'Return request is pending confirmation'
                  }}
                  </div>

                  <div v-if="orderDetail.status === 'CANCELLED' && orderDetail.cancelReason" class="mt-2 p-3 bg-red-100 rounded-md">
                    <div class="text-sm">
                      <span class="font-medium text-red-900">Cancellation Reason:</span>
                      <p class="text-red-800 mt-1">{{ orderDetail.cancelReason }}</p>
                    </div>
                  </div>

                  <div v-if="orderDetail.status === 'REJECTED_RETURN' && orderDetail.rejectReturnReason" class="mt-2 p-3 bg-red-100 rounded-md">
                    <div class="text-sm">
                      <span class="font-medium text-red-900">Rejection Reason:</span>
                      <p class="text-red-800 mt-1">{{ orderDetail.rejectReturnReason }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="orderDetail.status === 'PENDING_RETURN_CONFIRMATION'" class="mt-4 flex space-x-3">
                <va-button color="primary" class="return-info-button" @click="showReturnModal = true">
                  <va-icon name="info" class="mr-2"/>
                  View Return Details
                </va-button>
                <va-button
                    color="success"
                    class="return-action-button"
                    @click="handleAcceptReturn"
                    :loading="acceptReturnMutation.isPending.value"
                >
                  <va-icon name="check" class="mr-2"/>
                  Accept Return
                </va-button>
                <va-button
                    color="danger"
                    class="return-action-button"
                    @click="handleRejectReturn"
                    :loading="rejectReturnMutation.isPending.value"
                >
                  <va-icon name="close" class="mr-2"/>
                  Reject Return
                </va-button>
              </div>
            </div>

            <div v-if="orderDetail.status === 'CANCELLED' && orderDetail.paymentMethod === 'BANK_TRANSFER'"
                 class="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
              <h2 class="text-xl font-semibold text-gray-800 mb-4">Refund Information</h2>

              <div v-if="isRefundLoading" class="py-4">
                <va-inner-loading loading color="primary">
                  <va-icon name="hourglass_empty" size="large"/>
                </va-inner-loading>
              </div>

              <div v-else-if="isRefundError" class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                <va-icon name="error_outline" class="mr-2"/>
                Error loading refund information. Please try again.
              </div>

              <div v-else-if="refundData" class="border border-gray-200 rounded-lg overflow-hidden">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                  <div>
                    <div class="text-sm text-gray-500">Refund ID</div>
                    <div class="font-medium">#{{ refundData.id }}</div>
                  </div>
                  <div>
                    <div class="text-sm text-gray-500">Status</div>
                    <va-badge
                        :text="refundData.status"
                        :color="refundData.status === 'REFUNDED' ? 'success' : 'warning'"
                        class="status-badge"
                    />
                  </div>
                  <div>
                    <div class="text-sm text-gray-500">Bank Name</div>
                    <div class="font-medium">{{ refundData.bankName }}</div>
                  </div>
                  <div>
                    <div class="text-sm text-gray-500">Account Number</div>
                    <div class="font-medium">{{ refundData.accountNumber }}</div>
                  </div>
                  <div class="md:col-span-2">
                    <div class="text-sm text-gray-500">Refund Amount</div>
                    <div class="font-medium text-green-600 text-lg">{{ displayCurrency(refundData.refundAmount) }}</div>
                  </div>
                </div>

                <div v-if="refundData.status === 'PENDING'" class="p-4 border-t border-gray-200 bg-gray-50">
                  <va-button
                      color="success"
                      class="refund-action-button"
                      @click="handleConfirmRefund"
                      :loading="confirmRefundMutation.isPending.value"
                  >
                    <va-icon name="payments" class="mr-2"/>
                    Confirm Refund
                  </va-button>
                </div>
              </div>

              <div v-else class="p-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
                <va-icon name="info" class="mr-2"/>
                No refund information available for this order.
              </div>
            </div>

            <div class="border-t border-gray-100 my-4"></div>

            <div class="mb-4">
              <h3 class="text-md font-semibold text-gray-700 mb-2">Customer Information</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div class="text-sm text-gray-500">Recipient Name</div>
                  <div class="font-medium">{{ orderDetail.recipientName }}</div>
                </div>
                <div v-if="orderDetail.type !== 'POS'">
                  <div class="text-sm text-gray-500">Phone Number</div>
                  <div class="font-medium">{{ orderDetail.phoneNumber }}</div>
                </div>
              </div>
            </div>

            <div v-if="orderDetail.type !== 'POS'" class="mb-4">
              <h3 class="text-md font-semibold text-gray-700 mb-2">Shipping Address</h3>
              <div class="text-gray-700">{{ orderDetail.shippingAddress }}</div>
            </div>

            <div v-if="orderDetail.type !== 'POS'">
              <h3 class="text-md font-semibold text-gray-700 mb-2">Payment Method</h3>
              <div class="text-gray-700">{{ getPaymentMethodText(orderDetail.paymentMethod) }}</div>
            </div>
          </div>
        </div>

        <div v-if="orderDetail.type === 'POS'" class="pos-order-section mb-6">
          <div class="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
            <div class="flex items-center">
              <va-icon name="point_of_sale" class="text-blue-500 mr-3" size="large"/>
              <div>
                <h3 class="text-lg font-semibold text-blue-800">Point of Sale Order</h3>
                <p class="text-blue-600 text-sm">This order was processed in-store with cash payment. No shipping
                  required.</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 class="text-xl font-semibold text-gray-800 mb-4">Order Summary</h2>

            <div class="flex justify-between py-2">
              <span class="text-gray-600">Subtotal</span>
              <span class="font-medium">{{ displayCurrency(orderDetail.subtotal) }}</span>
            </div>

            <div class="flex justify-between py-2">
              <span class="text-gray-600">Shipping Fee</span>
              <span class="font-medium">{{ displayCurrency(orderDetail.shippingFee) }}</span>
            </div>

            <div v-if="orderDetail.discountAmount > 0" class="flex justify-between py-2">
              <span class="text-gray-600">Discount</span>
              <span class="font-medium text-green-600">-{{ displayCurrency(orderDetail.discountAmount) }}</span>
            </div>

            <div v-if="orderDetail.voucherId" class="flex justify-between py-2 text-sm">
              <span class="text-gray-500">Voucher Applied</span>
              <span class="text-gray-500">{{ orderDetail.voucherCode }}</span>
            </div>

            <div class="border-t border-gray-200 my-2"></div>

            <div class="flex justify-between py-2">
              <span class="font-semibold">Total</span>
              <span class="font-bold text-lg">{{ displayCurrency(orderDetail.totalAmount) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">Order Items</h2>

        <va-data-table
            :items="orderDetail.orderDetails"
            :columns="columns"
            striped
            hoverable
            class="w-full product-table very-compact-table"
        >
          <template #cell(product)="{ rowData }">
            <div class="product-info flex items-center">
              <img
                  :src="rowData.productThumbnail"
                  :alt="rowData.productName"
                  class="w-12 h-12 object-cover rounded bg-gray-100"
                  onerror="this.src='https://via.placeholder.com/60?text=No+Image'; this.onerror=null;"
              />
              <div class="product-details ml-3">
                <div class="product-name">{{ rowData.productName }}</div>
                <div class="text-xs text-gray-500">Category: {{ rowData.productCategoryName }}</div>
              </div>
            </div>
          </template>

          <template #cell(priceAtPurchase)="{ rowData }">
            <div class="font-medium">{{ displayCurrency(rowData.priceAtPurchase) }}</div>
          </template>

          <template #cell(quantity)="{ rowData }">
            <div class="font-medium">{{ rowData.quantity }}</div>
          </template>

          <template #cell(subtotal)="{ rowData }">
            <div class="font-medium">{{ displayCurrency(rowData.priceAtPurchase * rowData.quantity) }}</div>
          </template>
        </va-data-table>
      </div>

      <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">Order History</h2>

        <div class="order-timeline">
          <div class="timeline-item">
            <div class="timeline-point" :class="{'completed': true}"></div>
            <div class="timeline-content">
              <div class="font-medium">Order Created</div>
              <div class="text-sm text-gray-500">{{ formatDateTime(orderDetail.createdAt) }}</div>
            </div>
          </div>

          <div class="timeline-item" v-if="orderDetail.updatedAt && orderDetail.updatedAt !== orderDetail.createdAt">
            <div class="timeline-point" :class="{'completed': true}"></div>
            <div class="timeline-content">
              <div class="font-medium">Last Updated</div>
              <div class="text-sm text-gray-500">{{ formatDateTime(orderDetail.updatedAt) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <va-modal v-model="showReturnModal" title="Return Request Details" size="medium" :blur="true"
              :hide-default-actions="true">
      <div v-if="isReturnRequestLoading" class="flex justify-center items-center py-8">
        <va-inner-loading loading>
          <va-icon name="hourglass_empty" size="large"/>
        </va-inner-loading>
      </div>

      <div v-else-if="isReturnRequestError" class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 mb-6">
        <va-icon name="error_outline" class="mr-2"/>
        Error loading return request details. Please try again.
      </div>

      <div v-else-if="returnRequest" class="return-modal-content">

        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-2">Return Information</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
            <div>
              <div class="text-sm text-gray-500">Return ID</div>
              <div class="font-medium">#{{ returnRequest.id }}</div>
            </div>
            <div>
              <div class="text-sm text-gray-500">Total Return Amount</div>
              <div class="font-medium text-green-600">{{ displayCurrency(returnRequest.totalReturnAmount) }}</div>
            </div>
            <div class="md:col-span-2">
              <div class="text-sm text-gray-500">Reason for Return</div>
              <div class="font-medium">{{ returnRequest.reason }}</div>
            </div>
          </div>
        </div>

        <div>
          <h3 class="text-lg font-semibold mb-2">Items to Return</h3>
          <div class="overflow-hidden border border-gray-200 rounded-lg">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
              </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="item in returnRequest.returnDetails" :key="item.id" class="hover:bg-gray-50">
                <td class="px-4 py-3 whitespace-nowrap">
                  <div>
                    <div class="text-sm font-medium text-gray-900">
                      {{ getProductNameById(item.productId, orderDetail.orderDetails) }}
                    </div>
                    <div class="text-sm text-gray-500">ID: {{ item.productId }}</div>
                  </div>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm">
                  {{ item.returnQuantity }}
                </td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end space-x-2">
          <va-button color="gray" flat @click="showReturnModal = false">
            Cancel
          </va-button>
          <va-button color="primary" @click="showReturnModal = false">
            OK
          </va-button>
        </div>
      </template>
    </va-modal>

     <va-modal v-model="showCancelModal" title="Cancel Order" size="medium" :blur="true"
               :hide-default-actions="true">
       <div class="cancel-modal-content">
         <div class="mb-4">
           <p class="text-gray-700 mb-4">Are you sure you want to cancel this order? This action cannot be undone.</p>
           <va-textarea
             v-model="cancelReason"
             label="Reason for Cancellation (Optional)"
             placeholder="Please provide a reason for cancelling this order..."
             rows="3"
             class="w-full"
           />
         </div>
       </div>

       <template #footer>
         <div class="flex justify-end space-x-2">
           <va-button color="secondary" flat @click="showCancelModal = false">
             Keep Order
           </va-button>
           <va-button
             color="danger"
             @click="confirmCancelOrder"
             :loading="cancelOrderMutation.isPending.value"
           >
             Cancel Order
           </va-button>
         </div>
       </template>
     </va-modal>

     <va-modal v-model="showRejectReturnModal" title="Reject Return Request" size="medium" :blur="true"
               :hide-default-actions="true">
       <div class="reject-return-modal-content">
         <div class="mb-4">
           <p class="text-gray-700 mb-4">Are you sure you want to reject this return request? This will update the order status to REJECTED_RETURN.</p>
           <va-textarea
             v-model="rejectReturnReason"
             label="Reason for Rejection (Optional)"
             placeholder="Please provide a reason for rejecting this return request..."
             rows="3"
             class="w-full"
           />
         </div>
       </div>

       <template #footer>
         <div class="flex justify-end space-x-2">
           <va-button color="secondary" flat @click="showRejectReturnModal = false">
             Cancel
           </va-button>
           <va-button
             color="danger"
             @click="confirmRejectReturn"
             :loading="rejectReturnMutation.isPending.value"
           >
             Reject Return
           </va-button>
         </div>
       </template>
     </va-modal>
  </div>
</template>

<script>

function getProductNameById(productId, orderDetails) {
  if (!orderDetails) return `Product #${productId}`;
  const product = orderDetails.find(item => item.productId === productId);
  return product ? product.productName : `Product #${productId}`;
}

function getStepColor(index) {
  const colors = ['#6366F1', '#8B5CF6', '#EC4899', '#10B981'];
  return colors[index] || colors[0];
}
</script>

<style scoped>
.order-detail-page {
  animation: fadeIn 0.3s ease-in-out;
}

.status-badge {
  font-size: 0.875rem;
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

.order-progress-container {
  margin: 1.5rem 0;
}

.progress-steps {
  display: flex;
  justify-content: space-between;
  position: relative;
  padding: 0 1rem;
}

.progress-line {
  position: absolute;
  top: 1rem;
  left: 2rem;
  right: 2rem;
  height: 2px;
  background-color: #e5e7eb;
  z-index: 1;
}

.progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 2;
  width: 25%;
}

.step-marker {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: white;
  border: 2px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
  transition: all 0.2s ease-in-out;
}

.step-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  text-align: center;
  transition: color 0.2s ease-in-out;
}

.product-table {
  width: 100%;
  border-radius: 6px;
  overflow: hidden;
  --va-data-table-td-padding-x: 0.5rem;
  --va-data-table-th-padding-x: 0.5rem;
}

.product-table :deep(.va-data-table) {
  font-size: 0.9375rem !important;
}

.product-table :deep(.va-data-table__thead tr) {
  height: 1.75rem !important;
}

.product-table :deep(.va-data-table__body) {
  line-height: 1.2 !important;
}

.product-table :deep(.va-data-table__tbody tr) {
  height: 1.75rem !important;
  min-height: 1.75rem !important;
  max-height: 1.75rem !important;
}

.product-table :deep(.va-data-table__td) {
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  vertical-align: middle !important;
}

.product-table :deep(.va-data-table__th) {
  padding-top: 0.25rem !important;
  padding-bottom: 0.25rem !important;
  font-weight: 600;
}

.product-table :deep(.va-data-table__td) {
  font-size: 0.9375rem;
}

.product-table .product-info img,
.product-table .product-info .bg-gray-100 {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 5px;
  object-position: center;
  margin-top: -0.375rem;
  margin-bottom: -0.375rem;
  z-index: 2;
}

.product-details {
  margin-left: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
}

.product-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.very-compact-table :deep(.va-data-table__td-content) {
  align-items: center !important;
  justify-content: flex-start !important;
  height: 100% !important;
}

.very-compact-table :deep(.va-data-table__td) {
  height: 1.75rem !important;
  max-height: 1.75rem !important;
  overflow: visible !important;
  line-height: 1 !important;
}

:deep(.va-data-table__thead th) {
  text-align: left;
}

:deep(.va-data-table__tbody td) {
  text-align: left;
}

.order-timeline {
  margin-top: 1rem;
  position: relative;
}

.order-timeline::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 15px;
  width: 2px;
  background-color: #e5e7eb;
  z-index: 1;
}

.timeline-item {
  position: relative;
  padding-left: 40px;
  margin-bottom: 1.5rem;
  z-index: 2;
}

.timeline-point {
  position: absolute;
  left: 9px;
  top: 0;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid #e5e7eb;
  background-color: white;
}

.timeline-point.completed {
  border-color: #4F46E5;
  background-color: #4F46E5;
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
  .order-content {
    display: flex;
    flex-direction: column;
  }

  .progress-step .step-label {
    font-size: 0.7rem;
  }

  .progress-line {
    left: 1.5rem;
    right: 1.5rem;
  }
}

.status-update-button {
  font-weight: 500;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  transition: all 0.2s ease;
}

.status-update-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.return-action-button {
  font-weight: 500;
  transition: all 0.2s ease;
}

.return-action-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.return-info-button {
  font-weight: 500;
  transition: all 0.2s ease;
}

.return-info-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.return-modal-content {
  max-height: 70vh;
  overflow-y: auto;
  padding: 0.5rem;
}

.refund-action-button {
  font-weight: 500;
  transition: all 0.2s ease;
}

.refund-action-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.custom-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 2;
}

.step-marker {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  border: 2px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
  transition: all 0.2s ease-in-out;
}

.step-label {
  font-size: 0.75rem;
  text-align: center;
  transition: color 0.2s ease-in-out;
}

:deep(.va-stepper__button) {
  padding: 0;
}

:deep(.va-stepper__button-wrapper) {
  padding: 0;
}

:deep(.va-stepper__divider) {
  margin: 0 0.5rem;
  height: 2px;
}

:deep(.va-stepper__buttons) {
  margin-bottom: 1rem;
}

@media (max-width: 768px) {
  :deep(.va-stepper__divider) {
    margin: 0 0.25rem;
  }

  .step-label {
    font-size: 0.7rem;
  }
}

.pos-order-section {
  animation: fadeIn 0.5s ease-in-out;
}

@media (max-width: 768px) {
  .pos-order-section .flex.items-center {
    flex-direction: column;
    text-align: center;
  }
}

.cancel-modal-content {
  padding: 1rem;
}

.cancel-modal-content p {
  margin-bottom: 1rem;
  line-height: 1.6;
}

.reject-return-modal-content {
  padding: 1rem;
}

.reject-return-modal-content p {
  margin-bottom: 1rem;
  line-height: 1.6;
}

.reason-display {
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 6px;
  padding: 0.75rem;
  margin-top: 0.5rem;
}

.reason-display p {
  margin: 0;
  line-height: 1.5;
  word-wrap: break-word;
}

.stock-alert-section {
  animation: slideInFromTop 0.3s ease-out;
}

@keyframes slideInFromTop {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.cancel-order-button {
  font-weight: 500;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  transition: all 0.2s ease;
}

.cancel-order-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}
</style>
