<template>
  <div class="pos-page">

    <div class="page-header mb-6">
      <h1 class="text-2xl font-bold">🛒 Point of Sale (POS)</h1>
      <p class="text-gray-600 mt-2">Select products and quantities for your order</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <div class="lg:col-span-2">
        <div class="bg-white p-6 rounded-lg shadow-sm">
          <h2 class="text-lg font-semibold mb-4">Available Products</h2>

          <div class="mb-4 flex flex-wrap gap-3 items-end">
            <va-input
                v-model="productSearchQuery"
                placeholder="Search products..."
                icon="search"
                class="search-input mb-2"
            />

            <va-select
                v-model="categoryFilter"
                :options="categoryOptions"
                textBy="text"
                valueBy="value"
                :loading="products.isPending.value"
                color="primary"
                class="filter-select mb-2"
                placeholder="Filter by category"
            />

            <va-button
                icon="attach_money"
                color="primary"
                flat
                class="price-filter-btn mb-2"
                @click="showPriceFilter = !showPriceFilter"
            >
              Price Filter
            </va-button>
          </div>

          <div v-if="showPriceFilter"
               class="price-filter-container mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div class="flex flex-wrap items-end gap-4">
              <div class="price-input-group">
                <label class="block text-sm font-medium text-gray-600 mb-1">Min Price</label>
                <va-input
                    v-model="minPrice"
                    placeholder="Min price"
                    class="price-input"
                />
              </div>

              <div class="price-input-group">
                <label class="block text-sm font-medium text-gray-600 mb-1">Max Price</label>
                <va-input
                    v-model="maxPrice"
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
                    @click="resetPriceFilter"
                >
                  Reset
                </va-button>
              </div>

              <div v-if="minPrice || maxPrice" class="price-filter-summary flex items-center">
                <va-badge color="primary" class="mr-2">
                  <template #default>
                    <span v-if="minPrice && maxPrice">
                      {{ displayCurrency(minPrice) }} - {{ displayCurrency(maxPrice) }}
                    </span>
                    <span v-else-if="minPrice">
                      Min: {{ displayCurrency(minPrice) }}
                    </span>
                    <span v-else-if="maxPrice">
                      Max: {{ displayCurrency(maxPrice) }}
                    </span>
                  </template>
                </va-badge>
              </div>
            </div>
          </div>

          <div class="table-container">
            <div v-if="products.isError.value" class="error-container py-8 flex flex-col items-center justify-center">
              <va-icon name="error_outline" size="large" color="danger"/>
              <p class="mt-4 text-gray-600">Failed to load products. Please try again later.</p>
            </div>

            <div v-else>
              <va-data-table
                  v-model:selected="temporarySelectedProducts"
                  v-model:current-page="currentPage"
                  v-model:per-page="perPage"
                  :items="filteredProducts"
                  :columns="productColumns"
                  :loading="products.isPending.value"
                  :per-page-options="perPageOptions"
                  striped
                  hoverable
                  selectable
                  select-mode="multiple"
                  selected-color="primary"
                  class="products-table custom-alignment-table"
                  @selection-change="handleSelectionChange"
              >

                <template #cell(name)="{ rowData }">
                  <div class="product-info flex items-center"
                       :class="{ 'in-cart': isProductInCart(rowData.id) }">
                    <div class="relative">
                      <img
                          :src="rowData.thumbnail"
                          :alt="rowData.name"
                          class="w-12 h-12 object-cover rounded-lg mr-3"
                          :class="{ 'in-cart-image': isProductInCart(rowData.id) }"
                          @error="handleImageError"
                      />

                      <div v-if="isProductInCart(rowData.id)"
                           class="absolute -top-1 -right-1 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                        ✓
                      </div>
                    </div>
                    <div class="flex-1">
                      <div class="product-name font-medium flex items-center">
                        {{ rowData.name }}

                        <va-badge v-if="isProductInCart(rowData.id)"
                                  color="success"
                                  size="small"
                                  class="ml-2">
                          In Cart ({{ getCartItem(rowData.id)?.quantity }})
                        </va-badge>
                      </div>
                      <div class="product-sku text-xs text-gray-500">SKU: {{ rowData.sku }}</div>
                    </div>
                  </div>
                </template>

                <template #cell(categoryName)="{ rowData }">
                  <div class="category-name" :class="{ 'in-cart-text': isProductInCart(rowData.id) }">
                    {{ rowData.categoryName || '-' }}
                  </div>
                </template>

                <template #cell(stock)="{ rowData }">
                  <div class="stock">
                    <va-badge
                        :color="rowData.stock > 10 ? 'success' : rowData.stock > 0 ? 'warning' : 'danger'"
                        :text="rowData.stock.toString()"
                    />

                    <div v-if="isProductInCart(rowData.id)" class="text-xs text-gray-500 mt-1">
                      Available: {{ rowData.stock - getCartItem(rowData.id)?.quantity }}
                    </div>
                  </div>
                </template>

                <template #cell(price)="{ rowData }">
                  <div class="price-info" :class="{ 'in-cart-price': isProductInCart(rowData.id) }">
                    <div v-if="rowData.discountPercentage > 0" class="promotion-price">
                      <div class="original-price text-sm line-through text-gray-500">
                        {{ displayCurrency(rowData.price) }}
                      </div>
                      <div class="discounted-price font-medium text-green-600">
                        {{ displayCurrency(rowData.promotionPrice) }}
                      </div>
                      <va-badge color="success" size="small" class="mt-1">
                        -{{ rowData.discountPercentage }}%
                      </va-badge>
                    </div>
                    <div v-else class="regular-price font-medium">
                      {{ displayCurrency(rowData.price) }}
                    </div>

                    <div v-if="isProductInCart(rowData.id)"
                         class="cart-total-price text-xs text-blue-600 font-medium mt-1">
                      Cart: {{ displayCurrency(getItemPrice(rowData) * getCartItem(rowData.id)?.quantity) }}
                    </div>
                  </div>
                </template>

                <template #cell(avgRating)="{ rowData }">
                  <div class="rating flex items-center" :class="{ 'in-cart-text': isProductInCart(rowData.id) }">
                    <va-icon name="star" size="small" class="text-yellow-500 mr-1"/>
                    <span class="text-sm">{{ rowData.avgRating || 'N/A' }}</span>
                  </div>
                </template>

                <template #bodyAppend v-if="filteredProducts.length === 0 && !products.isPending.value">
                  <tr>
                    <td :colspan="productColumns.length" class="text-center py-8">
                      <div class="empty-state flex flex-col items-center justify-center">
                        <va-icon name="search_off" size="large" class="mb-4 text-gray-400"/>
                        <p v-if="productSearchQuery" class="text-gray-500">
                          No products match your search. Try a different keyword.
                        </p>
                        <p v-else class="text-gray-500">
                          No products available.
                        </p>
                      </div>
                    </td>
                  </tr>
                </template>
              </va-data-table>

              <div v-if="temporarySelectedProducts.length > 0" class="mt-4 p-3 bg-blue-50 rounded-md">
                <p class="text-sm font-medium text-blue-800">
                  {{ temporarySelectedProducts.length }} product{{ temporarySelectedProducts.length !== 1 ? 's' : '' }}
                  selected
                </p>
              </div>

              <div v-if="filteredProducts.length > 0"
                   class="mt-4 flex flex-wrap items-center justify-between gap-4 p-3 bg-gray-50 rounded-md pagination-summary">
                <div class="flex items-center gap-4">
                  <p class="text-sm text-gray-600">
                    Showing {{ ((currentPage - 1) * perPage) + 1 }} to
                    {{ Math.min(currentPage * perPage, filteredProducts.length) }}
                    of {{ filteredProducts.length }} products
                  </p>
                  <div v-if="productSearchQuery || categoryFilter !== 'all' || minPrice || maxPrice"
                       class="text-xs text-gray-500">
                    (filtered from {{ products?.data?.value?.length || 0 }} total)
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <span class="text-sm text-gray-600">Items per page:</span>
                  <va-select
                      v-model="perPage"
                      :options="perPageOptions"
                      class="w-20"
                      size="small"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="mt-6 flex justify-end">
            <va-button
                color="primary"
                icon="add_shopping_cart"
                :disabled="temporarySelectedProducts.length === 0"
                @click="showQuantityModal = true"
            >
              Add to Cart ({{ temporarySelectedProducts.length }})
            </va-button>
          </div>
        </div>
      </div>

      <div class="lg:col-span-1">
        <div class="bg-white p-6 rounded-lg shadow-sm sticky top-6">
          <h2 class="text-lg font-semibold mb-4">🛒 Shopping Cart</h2>

          <div v-if="selectedProducts.length === 0" class="text-center py-8">
            <va-icon name="shopping_cart" size="large" class="text-gray-400 mb-4"/>
            <p class="text-gray-500">Your cart is empty</p>
            <p class="text-sm text-gray-400">Select products to add them to cart</p>
          </div>

          <div v-else class="space-y-4">
            <div v-for="item in selectedProducts" :key="item.id"
                 class="cart-item border border-gray-200 rounded-lg p-4">
              <div class="flex items-start">
                <img
                    :src="item.thumbnail"
                    :alt="item.name"
                    class="w-12 h-12 object-cover rounded-lg mr-3"
                    @error="handleImageError"
                />
                <div class="flex-1">
                  <h4 class="font-medium text-sm">{{ item.name }}</h4>
                  <p class="text-xs text-gray-500">{{ item.sku }}</p>

                  <div class="flex items-center mt-2">
                    <va-button
                        icon="remove"
                        size="small"
                        flat
                        @click="decreaseQuantity(item)"
                        :disabled="item.quantity <= 1"
                    />
                    <span class="mx-3 font-medium">{{ item.quantity }}</span>
                    <va-button
                        icon="add"
                        size="small"
                        flat
                        @click="increaseQuantity(item)"
                        :disabled="item.quantity >= item.stock"
                    />
                  </div>

                  <div class="mt-2">
                    <div class="text-sm font-medium">
                      {{ displayCurrency(getItemPrice(item) * item.quantity) }}
                    </div>
                    <div class="text-xs text-gray-500">
                      {{ displayCurrency(getItemPrice(item)) }} each
                    </div>
                  </div>
                </div>

                <va-button
                    icon="delete_outline"
                    size="small"
                    color="danger"
                    flat
                    @click="removeFromCart(item)"
                />
              </div>
            </div>
          </div>

          <div v-if="selectedProducts.length > 0" class="mt-6 pt-4 border-t border-gray-200">
            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span>Items ({{ totalItems }})</span>
                <span>{{ displayCurrency(totalAmount) }}</span>
              </div>
              <div class="flex justify-between font-semibold text-lg border-t pt-2">
                <span>Total</span>
                <span>{{ displayCurrency(totalAmount) }}</span>
              </div>
            </div>

            <va-button
                color="success"
                class="w-full mt-4"
                icon="payment"
                size="large"
                @click="proceedToCheckout"
            >
              Proceed to Checkout
            </va-button>

            <va-button
                preset="secondary"
                class="w-full mt-2"
                icon="clear"
                @click="clearCart"
            >
              Clear Cart
            </va-button>
          </div>
        </div>
      </div>
    </div>

    <va-modal
        v-model="showQuantityModal"
        title="Set Quantities"
        overlay
        size="large"
        hide-default-actions
        :z-index="1050"
    >
      <template #default>
        <div class="space-y-4">
          <p class="text-gray-600 mb-4">Set the quantity for each selected product:</p>

          <div v-for="product in temporarySelectedProducts" :key="product.id"
               class="quantity-item border border-gray-200 rounded-lg p-4">
            <div class="flex items-center">
              <img
                  :src="product.thumbnail"
                  :alt="product.name"
                  class="w-12 h-12 object-cover rounded-lg mr-3"
                  @error="handleImageError"
              />
              <div class="flex-1">
                <h4 class="font-medium">{{ product.name }}</h4>
                <p class="text-sm text-gray-500">Stock: {{ product.stock }}</p>
                <p class="text-sm font-medium">{{ displayCurrency(getItemPrice(product)) }}</p>
              </div>

              <div class="flex items-center">
                <label class="text-sm font-medium mr-3">Qty:</label>
                <va-input
                    class="w-20"
                >
                  <input :disabled="productQuantities[product.id] >= product.stock"
                         type="number" min="1" :max="product.stock" v-model="productQuantities[product.id]">
                </va-input>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end">
          <va-button preset="secondary" class="mr-3" @click="cancelQuantitySelection">
            Cancel
          </va-button>
          <va-button @click="confirmQuantitySelection">
            Add to Cart
          </va-button>
        </div>
      </template>
    </va-modal>

    <va-modal
        v-model="showCheckoutModal"
        title="🛒 Checkout"
        overlay
        size="medium"
        hide-default-actions
        :z-index="1050"
    >
      <div class="checkout-content">

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">

          <div class="order-summary">
            <h4 class="font-semibold mb-3">Order Summary</h4>

            <div class="order-items space-y-2 mb-3">
              <div v-for="item in selectedProducts" :key="item.id"
                   class="flex items-center justify-between py-2 px-2 bg-gray-50 rounded">
                <div class="flex items-center flex-1">
                  <img
                      :src="item.thumbnail"
                      :alt="item.name"
                      class="w-8 h-8 object-cover rounded mr-2"
                      @error="handleImageError"
                  />
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium truncate">{{ item.name }}</div>
                    <div class="text-xs text-gray-500">{{ item.quantity }} × {{
                        displayCurrency(getItemPrice(item))
                      }}
                    </div>
                  </div>
                </div>
                <div class="text-sm font-semibold text-green-600 ml-2">
                  {{ displayCurrency(getItemPrice(item) * item.quantity) }}
                </div>
              </div>
            </div>

            <div class="bg-green-50 p-3 rounded border border-green-200">
              <div class="flex justify-between items-center">
                <span class="font-semibold">Total:</span>
                <span class="text-lg font-bold text-green-600">{{ displayCurrency(totalAmount) }}</span>
              </div>
            </div>
          </div>

          <div class="customer-info">
            <h4 class="font-semibold mb-3">Customer Information</h4>

            <va-input
                v-model="customerName"
                label="Customer Name*"
                placeholder="Enter customer name"
                class="w-full mb-3"
                required
            />

            <va-input
                v-model="phoneNumber"
                label="Phone Number*"
                placeholder="Enter customer phone number"
                class="w-full mb-3"
                required
            />

            <div class="bg-blue-50 p-3 rounded text-sm">
              <div class="font-medium text-blue-800">POS Order</div>
              <div class="text-blue-600">{{ totalItems }} items • Cash payment</div>
            </div>
          </div>
        </div>

        <div class="flex justify-between items-center mt-4 pt-3 border-t">
          <div class="font-semibold">
            Total: <span class="text-green-600">{{ displayCurrency(totalAmount) }}</span>
          </div>
          <div class="flex gap-2">
            <va-button
                preset="secondary"
                @click="cancelCheckout"
            >
              Cancel
            </va-button>
            <va-button
                color="success"
                icon="payment"
                @click="confirmCheckout"
            >
              Create Order
            </va-button>
          </div>
        </div>
      </div>
    </va-modal>
  </div>
</template>

<script setup>
import {useMutation, useQuery, useQueryClient} from "@tanstack/vue-query";
import axios from "axios";
import {computed, reactive, ref, watch} from "vue";
import {displayCurrency} from "@/utils/localeUtil.js";
import {useModal, useToast} from "vuestic-ui";

const {notify} = useToast();
const queryClient = useQueryClient();

const selectedProducts = ref([]);
const temporarySelectedProducts = ref([]);
const productSearchQuery = ref('');
const categoryFilter = ref('all');
const minPrice = ref('');
const maxPrice = ref('');
const showPriceFilter = ref(false);
const showQuantityModal = ref(false);
const productQuantities = reactive({});

const currentPage = ref(1);
const perPage = ref(10);
const perPageOptions = [5, 10, 20, 50, 100];

const showCheckoutModal = ref(false);
const customerName = ref('');
const phoneNumber = ref('');

const products = useQuery({
  queryKey: ['products/pos'],
  queryFn: async () => {
    const {data} = await axios.get('/products')
    return data?.result?.filter(product => product.status && product.stock > 0 && product.categoryStatus);
  },
  refetchOnMount: true
});

const productColumns = [
  {
    key: 'name',
    label: 'Product',
    sortable: true,
    width: '300px'
  },
  {
    key: 'categoryName',
    label: 'Category',
    sortable: true,
  },
  {
    key: 'stock',
    label: 'Stock',
    sortable: true,
    width: '80px'
  },
  {
    key: 'price',
    label: 'Price',
    sortable: true,
    width: '150px'
  },
  {
    key: 'avgRating',
    label: 'Rating',
    sortable: true,
    width: '80px'
  }
];

const categoryOptions = computed(() => {
  if (!products?.data?.value) return [{text: 'All Categories', value: 'all'}];

  const options = [{text: 'All Categories', value: 'all'}];

  products.data.value.forEach(product => {
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
  if (!products?.data?.value) return [];

  let filtered = products.data.value;

  if (categoryFilter.value !== 'all') {
    filtered = filtered.filter(product =>
        product.categoryId === parseInt(categoryFilter.value));
  }

  if (minPrice.value) {
    filtered = filtered.filter(product => getItemPrice(product) >= Number(minPrice.value));
  }

  if (maxPrice.value) {
    filtered = filtered.filter(product => getItemPrice(product) <= Number(maxPrice.value));
  }

  if (productSearchQuery.value) {
    const query = productSearchQuery.value.toLowerCase();
    filtered = filtered.filter(product =>
        product.name?.toLowerCase().includes(query) ||
        product.sku?.toLowerCase().includes(query) ||
        product.categoryName?.toLowerCase().includes(query)
    );
  }

  return filtered;
});

const isProductInCart = (productId) => {
  return selectedProducts.value.some(item => item.id === productId);
};

const getCartItem = (productId) => {
  return selectedProducts.value.find(item => item.id === productId);
};

const totalItems = computed(() => {
  return selectedProducts.value.reduce((total, item) => total + item.quantity, 0);
});

const totalAmount = computed(() => {
  return selectedProducts.value.reduce((total, item) => {
    return total + (getItemPrice(item) * item.quantity);
  }, 0);
});

const getItemPrice = (product) => {
  return product.discountPercentage > 0 ? product.promotionPrice : product.price;
};

const handleImageError = (event) => {
  event.target.src = 'https://via.placeholder.com/48x48?text=No+Image';
};

const resetPriceFilter = () => {
  minPrice.value = '';
  maxPrice.value = '';
};

const resetPagination = () => {
  currentPage.value = 1;
};

watch([productSearchQuery, categoryFilter, minPrice, maxPrice], () => {
  resetPagination();
});

const handleSelectionChange = (event) => {
  temporarySelectedProducts.value = event.currentSelectedItems;
};

const cancelQuantitySelection = () => {
  showQuantityModal.value = false;
  temporarySelectedProducts.value = [];
};

const confirmQuantitySelection = () => {
  temporarySelectedProducts.value.forEach(product => {
    const quantity = productQuantities[product.id] || 1;

    const existingIndex = selectedProducts.value.findIndex(item => item.id === product.id);

    if (existingIndex >= 0) {

      selectedProducts.value[existingIndex].quantity += quantity;
    } else {

      selectedProducts.value.push({
        ...product,
        quantity: quantity
      });
    }
  });

  temporarySelectedProducts.value = [];
  Object.keys(productQuantities).forEach(key => {
    delete productQuantities[key];
  });

  showQuantityModal.value = false;

  notify({
    message: 'Products added to cart successfully',
    color: 'success',
  });
};

const increaseQuantity = (item) => {
  if (item.quantity < item.stock) {
    item.quantity++;
  }
};

const decreaseQuantity = (item) => {
  if (item.quantity > 1) {
    item.quantity--;
  }
};

const removeFromCart = (item) => {
  const index = selectedProducts.value.findIndex(p => p.id === item.id);
  if (index >= 0) {
    selectedProducts.value.splice(index, 1);
  }
};

const clearCart = () => {
  selectedProducts.value = [];
};

const downloadInvoice = async (orderId) => {
  try {
    const response = await axios.get(`/orders/invoice/${orderId}`, {
      responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;

    const fileName = `invoice-GAD${orderId}.pdf`;
    link.setAttribute('download', fileName);

    document.body.appendChild(link);
    link.click();

    link.remove();
    window.URL.revokeObjectURL(url);

    notify({
      message: 'Invoice downloaded successfully',
      color: 'success',
    });
  } catch (error) {
    console.error('Download error:', error);
    notify({
      message: 'Failed to download invoice',
      color: 'danger',
    });
  }
};

const {confirm} = useModal()
const createOrderMutation = useMutation({
  mutationFn: async (order) => {
    return await axios.post('/orders/pos', order)
  },
  onSuccess: (data) => {
    clearCart();
    showCheckoutModal.value = false;
    customerName.value = '';
    phoneNumber.value = '';
    queryClient.invalidateQueries({queryKey: ['orders']})
    notify({
      message: 'Order created successfully',
      color: 'success',
    })

    const orderId = data.data?.result?.id;
    confirm({
      title: 'Order Created Successfully',
      message: 'Would you like to download the order invoice?',
      okText: 'Download',
      cancelText: 'Skip',
      child: {
        okButton: {
          color: 'success',
          icon: 'download'
        },
        cancelButton: {
          color: 'secondary'
        }
      }
    }).then((confirmed) => {
      if (confirmed) {
        downloadInvoice(orderId);
      }
    });
  },
  onError: () => {
    notify({
      message: 'Failed to create order',
      color: 'danger',
    })
  }
})

const proceedToCheckout = () => {
  if (selectedProducts.value.length === 0) {
    notify({
      message: 'Please add products to cart before checkout',
      color: 'warning',
    });
    return;
  }
  showCheckoutModal.value = true;
};

const confirmCheckout = async () => {
  if (!customerName.value.trim()) {
    notify({
      message: 'Please enter customer name',
      color: 'warning',
    });
    return;
  }

  if (!phoneNumber.value.trim()) {
    notify({
      message: 'Please enter customer phone number',
      color: 'warning',
    });
    return;
  }

  const subtotal = selectedProducts.value.reduce((total, item) => {
    return total + (getItemPrice(item) * item.quantity);
  }, 0);

  const order = {
    type: 'POS',
    subtotal: subtotal,
    status: 'DELIVERED',
    totalAmount: subtotal,
    recipientName: customerName.value.trim(),
    phoneNumber: phoneNumber.value.trim(),
    orderDetails: selectedProducts.value.map(item => ({
      productId: item.id,
      quantity: item.quantity,
      priceAtPurchase: item.promotionPrice
    }))
  };
  createOrderMutation.mutate(order);

};

const cancelCheckout = () => {
  showCheckoutModal.value = false;
  customerName.value = '';
  phoneNumber.value = '';
};

watch(showQuantityModal, (isOpen) => {
  if (isOpen) {
    temporarySelectedProducts.value.forEach(product => {
      productQuantities[product.id] = 1;
    });
  }
});
</script>

<style scoped>
.pos-page {
  animation: fadeIn 0.3s ease-in-out;
}

.products-table {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
}

.product-info {
  min-width: 200px;
}

.product-name {
  color: #374151;
}

.product-sku {
  margin-top: 2px;
}

.category-name {
  font-size: 0.875rem;
  color: #4B5563;
}

.price-info {
  text-align: right;
}

.original-price {
  text-decoration: line-through;
}

.empty-state {
  padding: 2rem 1rem;
}

.cart-item {
  transition: all 0.2s ease;
}

.cart-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.quantity-item {
  transition: all 0.2s ease;
}

.quantity-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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

@media (max-width: 1024px) {
  .grid.lg\\:grid-cols-3 {
    grid-template-columns: 1fr;
  }

  .sticky {
    position: static;
  }
}

@media (max-width: 640px) {
  .search-input {
    min-width: 200px;
  }

  .filter-select {
    min-width: 150px;
  }

  .product-info {
    min-width: 150px;
  }
}

.pagination-summary {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.pagination-summary .va-select {
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

:deep(.va-data-table__pagination) {
  padding: 1rem;
  background-color: #f8fafc;
  border-top: 1px solid #e2e8f0;
  border-radius: 0 0 8px 8px;
}

:deep(.va-pagination) {
  gap: 0.5rem;
}

:deep(.va-pagination .va-button) {
  min-width: 40px;
  height: 40px;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
}

:deep(.va-pagination .va-button:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

:deep(.va-pagination .va-button--active) {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

@media (max-width: 640px) {
  .pagination-summary {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .pagination-summary > div {
    justify-content: center;
  }

  :deep(.va-data-table__pagination) {
    padding: 0.75rem;
  }

  :deep(.va-pagination .va-button) {
    min-width: 36px;
    height: 36px;
    font-size: 0.875rem;
  }
}

.in-cart {
  background-color: #f0f9ff !important;
  border-left: 4px solid #10b981 !important;
  padding-left: 8px !important;
  position: relative;
}

.in-cart::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%);
  pointer-events: none;
}

.in-cart-image {
  border: 2px solid #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
}

.in-cart-text {
  color: #065f46 !important;
  font-weight: 500;
}

.in-cart-price {
  background-color: #ecfdf5;
  padding: 8px;
  border-radius: 6px;
  border: 1px solid #d1fae5;
}

.cart-total-price {
  background-color: #dbeafe;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #bfdbfe;
}

:deep(.va-data-table__tbody tr:has(.in-cart)) {
  background-color: #f8fafc !important;
  border-left: 4px solid #10b981;
}

:deep(.va-data-table__tbody tr:has(.in-cart):hover) {
  background-color: #f1f5f9 !important;
  transform: translateX(2px);
  transition: all 0.2s ease;
}

.in-cart .va-badge {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.absolute {
  animation: bounceIn 0.3s ease-out;
}

@keyframes bounceIn {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

.checkout-content {
  padding: 0;
}

.order-summary {
  background-color: #f9fafb;
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.customer-info {
  background-color: #fafafa;
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.order-items {
  max-height: 150px;
  overflow-y: auto;
}

.order-items::-webkit-scrollbar {
  width: 4px;
}

.order-items::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.order-items::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

@media (max-width: 1024px) {
  .order-summary,
  .customer-info {
    padding: 0.75rem;
  }

  .order-items {
    max-height: 120px;
  }
}
</style>
