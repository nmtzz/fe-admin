<template>
  <div class="min-h-screen bg-gray-50">

    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">📊 Order Statistics</h1>
      <p class="text-gray-600">Monthly revenue and order overview</p>
    </div>

    <div v-if="isMonthlyAllOrderLoading || isMonthlyDeliveredOrderLoading"
         class="flex items-center justify-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <span class="ml-3 text-gray-600">Loading data...</span>
    </div>

    <div v-else-if="isMonthlyAllOrderError || isMonthlyDeliveredOrderError"
         class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <p class="text-red-600">❌ Error occurred while loading data</p>
    </div>

    <div v-else class="space-y-6">

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="p-2 bg-blue-100 rounded-lg">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Total Orders</p>
              <p class="text-2xl font-semibold text-gray-900">{{ totalOrders.toLocaleString('en-US') }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="p-2 bg-green-100 rounded-lg">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Delivered Orders</p>
              <p class="text-2xl font-semibold text-gray-900">{{ totalDeliveredOrders.toLocaleString('en-US') }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="p-2 bg-yellow-100 rounded-lg">
              <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Success Rate</p>
              <p class="text-2xl font-semibold text-gray-900">{{ successRate }}%</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="p-2 bg-purple-100 rounded-lg">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Actual Revenue</p>
              <p class="text-2xl font-semibold text-gray-900">{{ displayCurrency(totalActualRevenue) }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">📈 Monthly Revenue</h3>
          <div class="h-80">
            <Line :data="revenueChartData" :options="chartOptions"/>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">📊 Monthly Orders</h3>
          <div class="h-80">
            <Bar :data="ordersChartData" :options="chartOptions"/>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">🎯 Monthly Success Rate</h3>
        <div class="h-80">
          <Line :data="successRateChartData" :options="percentageChartOptions"/>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">📋 Monthly Details</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Orders
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivered
                Orders
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Success Rate
                (%)
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual
                Revenue
              </th>
            </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="item in combinedData" :key="item.month" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ item.month }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{
                  item.allOrders.toLocaleString('en-US')
                }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ item.deliveredOrders.toLocaleString('en-US') }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                        :class="getSuccessRateClass(item.successRate)">
                    {{ item.successRate }}%
                  </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{
                  displayCurrency(item.totalRevenue)
                }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{
                  displayCurrency(item.actualRevenue)
                }}
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {computed} from 'vue'
import {useQuery} from "@tanstack/vue-query"
import axios from "axios"
import {displayCurrency} from "@/utils/localeUtil"
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip
} from 'chart.js'
import {Bar, Line} from 'vue-chartjs'

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
)

const {data: monthlyAllOrder, isPending: isMonthlyAllOrderLoading, isError: isMonthlyAllOrderError} = useQuery({
  queryKey: ['monthlyAllOrder'],
  queryFn: async () => {
    const {data} = await axios.get('/statistics/monthly-all-orders')
    return data?.result
  }
})

const {
  data: monthlyDeliveredOrder,
  isPending: isMonthlyDeliveredOrderLoading,
  isError: isMonthlyDeliveredOrderError
} = useQuery({
  queryKey: ['monthlyDeliveredOrder'],
  queryFn: async () => {
    const {data} = await axios.get('/statistics/monthly-delivered-orders')
    return data?.result
  }
})

const combinedData = computed(() => {
  if (!monthlyAllOrder.value || !monthlyDeliveredOrder.value) return []

  const allOrdersMap = new Map()

  monthlyAllOrder.value.forEach(item => {
    allOrdersMap.set(item.thangNam, {
      month: item.thangNam,
      allOrders: item.allOrders,
      totalRevenue: item.revenue,
      deliveredOrders: 0,
      actualRevenue: 0
    })
  })

  monthlyDeliveredOrder.value.forEach(item => {
    if (allOrdersMap.has(item.thangNam)) {
      const existing = allOrdersMap.get(item.thangNam)
      existing.deliveredOrders = item.deliveredOrders
      existing.actualRevenue = item.revenue
    }
  })

  return Array.from(allOrdersMap.values()).map(item => ({
    ...item,
    successRate: item.allOrders > 0 ? Math.round((item.deliveredOrders / item.allOrders) * 100) : 0
  }))
})

const totalOrders = computed(() => {
  return combinedData.value.reduce((sum, item) => sum + item.allOrders, 0)
})

const totalDeliveredOrders = computed(() => {
  return combinedData.value.reduce((sum, item) => sum + item.deliveredOrders, 0)
})

const totalActualRevenue = computed(() => {
  return combinedData.value.reduce((sum, item) => sum + item.actualRevenue, 0)
})

const successRate = computed(() => {
  return totalOrders.value > 0 ? Math.round((totalDeliveredOrders.value / totalOrders.value) * 100) : 0
})

const revenueChartData = computed(() => ({
  labels: combinedData.value.map(item => item.month),
  datasets: [
    {
      label: 'Total Revenue',
      data: combinedData.value.map(item => item.totalRevenue),
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4
    },
    {
      label: 'Actual Revenue',
      data: combinedData.value.map(item => item.actualRevenue),
      borderColor: '#10B981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      fill: true,
      tension: 0.4
    }
  ]
}))

const ordersChartData = computed(() => ({
  labels: combinedData.value.map(item => item.month),
  datasets: [
    {
      label: 'Total Orders',
      data: combinedData.value.map(item => item.allOrders),
      backgroundColor: '#3B82F6'
    },
    {
      label: 'Delivered Orders',
      data: combinedData.value.map(item => item.deliveredOrders),
      backgroundColor: '#10B981'
    }
  ]
}))

const successRateChartData = computed(() => ({
  labels: combinedData.value.map(item => item.month),
  datasets: [
    {
      label: 'Success Rate (%)',
      data: combinedData.value.map(item => item.successRate),
      borderColor: '#8B5CF6',
      backgroundColor: 'rgba(139, 92, 246, 0.1)',
      fill: true,
      tension: 0.4
    }
  ]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top'
    },
    tooltip: {
      callbacks: {
        label: function (context) {
          if (context.dataset.label.includes('Revenue')) {
            return context.dataset.label + ': ' + displayCurrency(context.parsed.y)
          }
          return context.dataset.label + ': ' + context.parsed.y.toLocaleString('en-US')
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: function (value) {
          if (this.chart.data.datasets[0].label.includes('Revenue')) {
            return displayCurrency(value)
          }
          return value.toLocaleString('en-US')
        }
      }
    }
  }
}

const percentageChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top'
    },
    tooltip: {
      callbacks: {
        label: function (context) {
          return context.dataset.label + ': ' + context.parsed.y + '%'
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      max: 100,
      ticks: {
        callback: function (value) {
          return value + '%'
        }
      }
    }
  }
}

const getSuccessRateClass = (rate) => {
  if (rate >= 80) return 'bg-green-100 text-green-800'
  if (rate >= 60) return 'bg-yellow-100 text-yellow-800'
  if (rate >= 40) return 'bg-orange-100 text-orange-800'
  return 'bg-red-100 text-red-800'
}
</script>
