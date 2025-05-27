<template>
  <div class="dashboard-page" v-if="loggedInUser?.role === 'ADMIN'">

    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">📊 Dashboard Overview</h1>
      <p class="text-gray-600">Real-time business metrics and performance indicators</p>
    </div>

    <div v-if="isOverviewLoading" class="flex items-center justify-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <span class="ml-3 text-gray-600">Loading overview data...</span>
    </div>

    <div v-else-if="isOverviewError" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <p class="text-red-600">❌ Error occurred while loading overview data</p>
    </div>

    <div v-else class="space-y-6">

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        <div class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div class="flex items-center">
            <div class="p-3 bg-blue-100 rounded-lg">
              <va-icon name="shopping_cart" size="large" class="text-blue-600"/>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Total Orders</p>
              <p class="text-2xl font-semibold text-gray-900">{{ formatNumber(overview?.totalOrders || 0) }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div class="flex items-center">
            <div class="p-3 bg-red-100 rounded-lg">
              <va-icon name="payment" size="large" class="text-red-600"/>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Unpaid Orders</p>
              <p class="text-2xl font-semibold text-gray-900">{{ formatNumber(overview?.unpaidOrders || 0) }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div class="flex items-center">
            <div class="p-3 bg-yellow-100 rounded-lg">
              <va-icon name="pending" size="large" class="text-yellow-600"/>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Pending Confirmation</p>
              <p class="text-2xl font-semibold text-gray-900">{{
                  formatNumber(overview?.pendingConfirmationOrders || 0)
                }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div class="flex items-center">
            <div class="p-3 bg-green-100 rounded-lg">
              <va-icon name="check_circle" size="large" class="text-green-600"/>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Delivered Orders</p>
              <p class="text-2xl font-semibold text-gray-900">{{ formatNumber(overview?.deliveredOrders || 0) }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        <div class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div class="flex items-center">
            <div class="p-3 bg-orange-100 rounded-lg">
              <va-icon name="local_shipping" size="large" class="text-orange-600"/>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Pending Shipping</p>
              <p class="text-2xl font-semibold text-gray-900">{{
                  formatNumber(overview?.pendingShippingOrders || 0)
                }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div class="flex items-center">
            <div class="p-3 bg-indigo-100 rounded-lg">
              <va-icon name="directions_car" size="large" class="text-indigo-600"/>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Shipping Orders</p>
              <p class="text-2xl font-semibold text-gray-900">{{ formatNumber(overview?.shippingOrders || 0) }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div class="flex items-center">
            <div class="p-3 bg-gray-100 rounded-lg">
              <va-icon name="cancel" size="large" class="text-gray-600"/>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Cancelled Orders</p>
              <p class="text-2xl font-semibold text-gray-900">{{ formatNumber(overview?.cancelledOrders || 0) }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div class="flex items-center">
            <div class="p-3 bg-purple-100 rounded-lg">
              <va-icon name="keyboard_return" size="large" class="text-purple-600"/>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Returned Orders</p>
              <p class="text-2xl font-semibold text-gray-900">{{ formatNumber(overview?.returnedOrders || 0) }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        <div class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div class="flex items-center">
            <div class="p-3 bg-emerald-100 rounded-lg">
              <va-icon name="attach_money" size="large" class="text-emerald-600"/>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Total Revenue</p>
              <p class="text-2xl font-semibold text-gray-900">{{ displayCurrency(overview?.totalRevenue || 0) }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div class="flex items-center">
            <div class="p-3 bg-teal-100 rounded-lg">
              <va-icon name="monetization_on" size="large" class="text-teal-600"/>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Delivered Revenue</p>
              <p class="text-2xl font-semibold text-gray-900">{{ displayCurrency(overview?.deliveredRevenue || 0) }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div class="flex items-center">
            <div class="p-3 bg-cyan-100 rounded-lg">
              <va-icon name="trending_up" size="large" class="text-cyan-600"/>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Success Rate</p>
              <p class="text-2xl font-semibold text-gray-900">{{
                  formatPercentage(overview?.successRatePercent || 0)
                }}%</p>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

        <div class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div class="flex items-center">
            <div class="p-3 bg-lime-100 rounded-lg">
              <va-icon name="receipt" size="large" class="text-lime-600"/>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Total Subtotal</p>
              <p class="text-2xl font-semibold text-gray-900">{{ displayCurrency(overview?.totalSubtotal || 0) }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div class="flex items-center">
            <div class="p-3 bg-amber-100 rounded-lg">
              <va-icon name="local_shipping" size="large" class="text-amber-600"/>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Total Shipping Fee</p>
              <p class="text-2xl font-semibold text-gray-900">{{ displayCurrency(overview?.totalShippingFee || 0) }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div class="flex items-center">
            <div class="p-3 bg-rose-100 rounded-lg">
              <va-icon name="discount" size="large" class="text-rose-600"/>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Total Discount</p>
              <p class="text-2xl font-semibold text-gray-900">{{ displayCurrency(overview?.totalDiscount || 0) }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">🚀 Quick Actions</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <va-button
              color="primary"
              icon="add_shopping_cart"
              class="w-full"
              @click="$router.push('/orders')"
          >
            View Orders
          </va-button>
          <va-button
              color="success"
              icon="inventory"
              class="w-full"
              @click="$router.push('/products')"
          >
            Manage Products
          </va-button>
          <va-button
              color="info"
              icon="bar_chart"
              class="w-full"
              @click="$router.push('/statistics')"
          >
            View Statistics
          </va-button>
          <va-button
              color="warning"
              icon="campaign"
              class="w-full"
              @click="$router.push('/promotions')"
          >
            Manage Promotions
          </va-button>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="space-y-6">

    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">👋 Welcome, {{ loggedInUser?.fullName }}</h1>
      <p class="text-gray-600">Your personal dashboard - manage your account and access available features</p>
    </div>

    <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
      <div class="flex items-center">
        <div class="p-3 bg-blue-100 rounded-lg">
          <va-icon name="person" size="large" class="text-blue-600"/>
        </div>
        <div class="ml-4 flex-1">
          <h3 class="text-lg font-semibold text-gray-900">Account Information</h3>
          <div class="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div class="flex items-center">
              <va-icon name="badge" size="small" class="text-gray-500 mr-2"/>
              <span class="text-gray-600">ID: <span class="font-medium text-gray-900">#{{
                  loggedInUser?.id
                }}</span></span>
            </div>
            <div class="flex items-center">
              <va-icon name="email" size="small" class="text-gray-500 mr-2"/>
              <span class="text-gray-600">Email: <span class="font-medium text-gray-900">{{
                  loggedInUser?.email
                }}</span></span>
            </div>
            <div class="flex items-center">
              <va-icon name="admin_panel_settings" size="small" class="text-gray-500 mr-2"/>
              <span class="text-gray-600">Role:
                <va-badge :text="loggedInUser?.role" color="info" class="ml-1"/>
              </span>
            </div>
            <div class="flex items-center">
              <va-icon name="verified" size="small" class="text-gray-500 mr-2"/>
              <span class="text-gray-600">Status:
                <va-badge text="Active" color="success" class="ml-1"/>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <va-icon name="apps" class="mr-2 text-blue-600"/>
        Available Actions
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <va-button
            color="primary"
            icon="account_circle"
            class="w-full h-12"
            @click="$router.push('/account')"
        >
          Manage Account
        </va-button>
        <va-button
            color="success"
            icon="shopping_cart"
            class="w-full h-12"
            @click="$router.push('/orders')"
        >
          View Orders
        </va-button>
        <va-button
            color="info"
            icon="inventory"
            class="w-full h-12"
            @click="$router.push('/products')"
        >
          Browse Products
        </va-button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

      <div class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-all duration-300 cursor-pointer"
           @click="$router.push('/orders')">
        <div class="flex items-center mb-4">
          <div class="p-3 bg-green-100 rounded-lg">
            <va-icon name="receipt_long" size="large" class="text-green-600"/>
          </div>
          <div class="ml-4">
            <h4 class="text-lg font-semibold text-gray-900">Order Management</h4>
            <p class="text-sm text-gray-600">Track and manage orders</p>
          </div>
        </div>
        <p class="text-gray-700 text-sm">View order history, track shipments, and manage order details.</p>
        <div class="mt-4 flex items-center text-blue-600 text-sm font-medium">
          <span>Explore Orders</span>
          <va-icon name="arrow_forward" size="small" class="ml-1"/>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-all duration-300 cursor-pointer"
           @click="$router.push('/products')">
        <div class="flex items-center mb-4">
          <div class="p-3 bg-purple-100 rounded-lg">
            <va-icon name="inventory_2" size="large" class="text-purple-600"/>
          </div>
          <div class="ml-4">
            <h4 class="text-lg font-semibold text-gray-900">Product Catalog</h4>
            <p class="text-sm text-gray-600">Browse available products</p>
          </div>
        </div>
        <p class="text-gray-700 text-sm">Explore the product catalog and view detailed product information.</p>
        <div class="mt-4 flex items-center text-purple-600 text-sm font-medium">
          <span>Browse Products</span>
          <va-icon name="arrow_forward" size="small" class="ml-1"/>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-all duration-300 cursor-pointer"
           @click="$router.push('/account')">
        <div class="flex items-center mb-4">
          <div class="p-3 bg-orange-100 rounded-lg">
            <va-icon name="settings" size="large" class="text-orange-600"/>
          </div>
          <div class="ml-4">
            <h4 class="text-lg font-semibold text-gray-900">Account Settings</h4>
            <p class="text-sm text-gray-600">Manage your profile</p>
          </div>
        </div>
        <p class="text-gray-700 text-sm">Update your profile information and change your password.</p>
        <div class="mt-4 flex items-center text-orange-600 text-sm font-medium">
          <span>Manage Account</span>
          <va-icon name="arrow_forward" size="small" class="ml-1"/>
        </div>
      </div>
    </div>

    <div class="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-lg p-6">
      <div class="flex items-start">
        <div class="p-2 bg-gray-100 rounded-lg">
          <va-icon name="help_outline" size="large" class="text-gray-600"/>
        </div>
        <div class="ml-4 flex-1">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">💡 Need Help?</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div class="flex items-start">
              <va-icon name="check_circle" size="small" class="text-green-600 mr-2 mt-0.5"/>
              <span>Use the sidebar to navigate between sections</span>
            </div>
            <div class="flex items-start">
              <va-icon name="check_circle" size="small" class="text-green-600 mr-2 mt-0.5"/>
              <span>Update your account settings regularly</span>
            </div>
            <div class="flex items-start">
              <va-icon name="check_circle" size="small" class="text-green-600 mr-2 mt-0.5"/>
              <span>Track your orders in the Orders section</span>
            </div>
            <div class="flex items-start">
              <va-icon name="check_circle" size="small" class="text-green-600 mr-2 mt-0.5"/>
              <span>Contact support if you need assistance</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="p-3 bg-blue-100 rounded-lg">
            <va-icon name="access_time" size="large" class="text-blue-600"/>
          </div>
          <div class="ml-4">
            <h4 class="text-lg font-semibold text-gray-900">Session Info</h4>
            <p class="text-sm text-gray-600">Logged in as {{ loggedInUser?.role }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="p-3 bg-green-100 rounded-lg">
            <va-icon name="security" size="large" class="text-green-600"/>
          </div>
          <div class="ml-4">
            <h4 class="text-lg font-semibold text-gray-900">Security Status</h4>
            <p class="text-sm text-gray-600">Account is secure</p>
            <p class="text-xs text-gray-500 mt-1">Remember to change your password regularly</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {useQuery} from "@tanstack/vue-query";
import axios from "axios";
import {displayCurrency} from "@/utils/localeUtil";
import {getLoggedInUser} from "@/services/authService.js";

const loggedInUser = getLoggedInUser()
const {data: overview, isPending: isOverviewLoading, isError: isOverviewError} = useQuery({
  queryKey: ['overview'],
  queryFn: async () => {
    const {data} = await axios.get('/statistics/overview')
    return data?.result?.[0]
  }
})

const formatNumber = (value) => {
  if (!value) return '0'
  return new Intl.NumberFormat('en-US').format(value)
}

const formatPercentage = (value) => {
  if (!value) return '0.0'
  return Number(value).toFixed(1)
}
</script>

<style scoped>
.dashboard-page {
  animation: fadeIn 0.3s ease-in-out;
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

.bg-white {
  transition: all 0.3s ease;
}

.bg-white:hover {
  transform: translateY(-2px);
}

@media (max-width: 640px) {
  .grid {
    grid-template-columns: 1fr;
  }

  .text-3xl {
    font-size: 1.875rem;
  }

  .text-2xl {
    font-size: 1.5rem;
  }
}

@media (max-width: 768px) {
  .grid.md\:grid-cols-2 {
    grid-template-columns: 1fr;
  }

  .grid.md\:grid-cols-3 {
    grid-template-columns: 1fr;
  }

  .grid.md\:grid-cols-4 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 1024px) {
  .grid.lg\:grid-cols-3 {
    grid-template-columns: repeat(2, 1fr);
  }

  .grid.lg\:grid-cols-4 {
    grid-template-columns: repeat(2, 1fr);
  }
}

.loading-container,
.error-container {
  min-height: 300px;
}

.va-icon {
  font-size: 1.5rem;
}

.va-button {
  height: 48px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.va-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
