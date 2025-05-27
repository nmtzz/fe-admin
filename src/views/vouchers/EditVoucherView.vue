<script setup>
import {useMutation, useQuery, useQueryClient} from '@tanstack/vue-query';
import axios from 'axios';
import {reactive, watch} from 'vue';
import {useForm, useModal, useToast, VaInput} from 'vuestic-ui'
import {isPositive, lessThan, minLength, notZero, requiredField} from '@/utils/validationUtil'
import {useRoute, useRouter} from 'vue-router';
import {formatDate, parseDate} from "@/utils/localeUtil.js";

const {notify} = useToast()
const queryClient = useQueryClient()
const router = useRouter();
const route = useRoute();
const {confirm} = useModal()

const voucherId = route.params.voucherId;
const voucherFormRef = useForm('myVoucherFormRef')
const voucherForm = reactive({
  id: voucherId,
  code: '',
  discountType: 'PERCENTAGE',
  discountAmount: 0,
  startDate: new Date(),
  endDate: new Date(),
  minOrderAmount: 0,
  maxOrderAmount: 0,
  maxDiscountAmount: 0,
  quantity: 100,
  used: 0,
  status: true
})

const {data: voucherData, isPending: isVoucherLoading, isError: isVoucherError} = useQuery({
  queryKey: [`vouchers/${voucherId}`],
  queryFn: async () => {
    const response = await axios.get(`/vouchers/${voucherId}`);
    return response.data;
  }
})

watch(() => voucherData.value, (data) => {
  if (data && data.result) {
    const voucher = data.result;
    voucherForm.id = voucher.id;
    voucherForm.code = voucher.code;
    voucherForm.discountType = voucher.discountType;
    voucherForm.discountAmount = voucher.discountAmount || 0;
    voucherForm.startDate = voucher.startDate ? new Date(voucher.startDate) : new Date();
    voucherForm.endDate = voucher.endDate ? new Date(voucher.endDate) : new Date();
    voucherForm.minOrderAmount = voucher.minOrderAmount || 0;
    voucherForm.maxOrderAmount = voucher.maxOrderAmount || 0;
    voucherForm.maxDiscountAmount = voucher.maxDiscountAmount || 0;
    voucherForm.quantity = voucher.quantity;
    voucherForm.used = voucher.used || 0;
    voucherForm.status = voucher.status !== undefined ? voucher.status : true;
  }
}, {immediate: true})

const mutation = useMutation({
  mutationFn: async (voucher) => {
    return await axios.put(`/vouchers`, voucher)
  },
  onSuccess: () => {
    queryClient.invalidateQueries({queryKey: ['vouchers']})
    queryClient.invalidateQueries({queryKey: [`vouchers/${voucherId}`]})
    notify({
      message: 'Voucher updated successfully',
      color: 'success',
    })
    router.push('/vouchers');
  },
  onError: (error) => {
    notify({
      message: `Failed to update voucher: ${error.response?.data?.message || error.response?.data?.error || 'Unknown error'}`,
      color: 'danger',
    })
  }
})

const validateDates = () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const start = new Date(voucherForm.startDate)
  start.setHours(0, 0, 0, 0)

  const end = new Date(voucherForm.endDate)
  end.setHours(0, 0, 0, 0)
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0)
  if (end < currentDate) {
    notify({
      message: 'End date cannot be in the past',
      color: 'warning',
      duration: 4000,
    })
    return false
  }

  if (start >= end) {
    notify({
      message: 'End date must be after start date',
      color: 'warning',
      duration: 4000,
    })
    return false
  }

  return true
}

const validateDiscountValue = () => {
  if (voucherForm.discountAmount === null || voucherForm.discountAmount <= 0) {
    notify({
      message: 'Discount value must be greater than 0',
      color: 'warning',
      duration: 4000,
    })
    return false
  }

  if (voucherForm.discountType === 'PERCENTAGE' && voucherForm.discountAmount > 100) {
    notify({
      message: 'Percentage discount cannot exceed 100%',
      color: 'warning',
      duration: 4000,
    })
    return false
  }

  return true
}

const validateOrderValues = () => {
  if (voucherForm.minOrderAmount !== null && voucherForm.maxOrderAmount !== null &&
      voucherForm.minOrderAmount > 0 && voucherForm.maxOrderAmount > 0) {
    if (parseFloat(voucherForm.minOrderAmount) >= parseFloat(voucherForm.maxOrderAmount)) {
      notify({
        message: 'Maximum order value must be greater than minimum order value',
        color: 'warning',
        duration: 4000,
      })
      return false
    }
  }

  return true
}

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

const handleSubmit = () => {
  voucherFormRef.validate()

  if (!voucherFormRef.isValid.value) {
    return
  }

  if (!validateDates() || !validateDiscountValue() || !validateOrderValues()) {
    return
  }

  confirm({
    title: 'Update Voucher',
    message: 'Are you sure you want to update this voucher?',
    okText: 'Update',
    cancelText: 'Cancel',
    child: {
      okButton: {
        color: 'primary'
      }
    }
  }).then((confirmed) => {
    if (confirmed) {
      const formattedVoucher = {
        ...voucherForm,
      }

      formattedVoucher.startDate = setStartOfDay(formattedVoucher.startDate).toISOString();
      formattedVoucher.endDate = setEndOfDay(formattedVoucher.endDate).toISOString();

      if (formattedVoucher.maxDiscountAmount === 0) formattedVoucher.maxDiscountAmount = null;
      if (formattedVoucher.minOrderAmount === 0) formattedVoucher.minOrderAmount = null;
      if (formattedVoucher.maxOrderAmount === 0) formattedVoucher.maxOrderAmount = null;

      mutation.mutate(formattedVoucher);
    }
  })
}

const generateRandomCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const codeLength = 8
  let code = ''

  for (let i = 0; i < codeLength; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length)
    code += characters.charAt(randomIndex)
  }

  voucherForm.code = code
}

const handleCancel = () => {
  router.back()
}
</script>

<template>
  <div class="voucher-page">
    <div class="page-header mb-6">
      <h1 class="text-2xl font-bold">Edit Voucher</h1>
      <p class="text-gray-600 mt-2">Modify an existing discount voucher</p>
    </div>

    <div class="voucher-card bg-white p-6 rounded-lg">

      <div class="card-content">

        <div v-if="isVoucherLoading" class="loading-container">
          <va-inner-loading loading>
            <va-icon name="cached" spin size="large"/>
          </va-inner-loading>
          <div class="mt-3 text-gray-600">Loading voucher data...</div>
        </div>

        <div v-else-if="isVoucherError" class="error-container">
          <va-icon name="error_outline" size="large" color="danger"/>
          <p class="mt-3 text-danger">Failed to load voucher details. Please try again later.</p>
          <va-button class="mt-4" color="primary" @click="$router.go()">
            Retry
          </va-button>
        </div>

        <div v-else class="form-container">
          <va-form ref="myVoucherFormRef" class="voucher-form">

            <div class="form-section">
              <h3 class="text-lg font-semibold mb-4">Voucher Information</h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div class="flex items-end">
                  <va-input
                      v-model="voucherForm.code"
                      label="Voucher Code"
                      placeholder="Enter voucher code"
                      :rules="[requiredField('Voucher Code'), minLength('Voucher Code', 3)]"
                      class="w-full"
                  />
                  <va-button
                      icon="casino"
                      class="ml-2 mb-1"
                      preset="secondary"
                      square
                      @click="generateRandomCode"
                      title="Generate random code"
                  />
                </div>

                <va-input
                    v-model="voucherForm.quantity"
                    label="Quantity"
                    placeholder="Enter number of vouchers"
                    type="number"
                    :min="1"
                    :rules="[requiredField('Quantity'), isPositive('Quantity')]"
                />
              </div>

              <div class="usage-info mb-4 p-3 bg-gray-100 rounded-lg">
                <p class="text-sm font-medium text-gray-700">
                  Used: {{ voucherForm.used }} / {{ voucherForm.quantity }}
                </p>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <va-date-input
                    v-model="voucherForm.startDate"
                    label="Start Date"
                    :rules="[requiredField('Start Date')]"
                    :format-date="formatDate"
                    :parse-date="parseDate"
                />

                <va-date-input
                    v-model="voucherForm.endDate"
                    label="End Date"
                    :rules="[requiredField('End Date')]"
                    :format-date="formatDate"
                    :parse-date="parseDate"
                    :allowed-days="(date) => !voucherForm.startDate || new Date(date) >= new Date(voucherForm.startDate)"
                />
              </div>
            </div>

            <div class="form-section mt-6">
              <h3 class="text-lg font-semibold mb-4">Discount Configuration</h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label class="va-form-element__label mb-1 block">Discount Type</label>
                  <VaRadio
                      v-model="voucherForm.discountType"
                      :options="[{text: 'Percentage (%)', value: 'PERCENTAGE'}, {text: 'Fixed Amount', value: 'FIXED'}]"
                      text-by="text"
                      value-by="value"
                      vertical
                  />
                </div>

                <va-input
                    v-if="voucherForm.discountType === 'FIXED'"
                    v-model="voucherForm.discountAmount"
                    label="Discount Amount"
                    placeholder="Enter discount amount"
                    :rules="[notZero('Discount Value'), isPositive('Discount Value')]">
                  <money3
                      v-model.number="voucherForm.discountAmount"
                      v-bind="{
                                precision: 0,
                                allowBlank: true
                            }"
                  />
                </va-input>
                <VaInput v-else
                         v-model="voucherForm.discountAmount"
                         label="Discount percentage (%)"
                         placeholder="Enter discount percentage"
                         type="number"
                         :rules="[notZero('Discount Value'), isPositive('Discount Value'), lessThan('Discount Value', 101)]"
                />
              </div>

              <div v-if="voucherForm.discountType === 'PERCENTAGE'" class="mb-4">
                <va-input
                    v-model="voucherForm.maxDiscountAmount"
                    label="Maximum Discount Amount (Optional)"
                    placeholder="Maximum amount to discount for percentage"
                    :rules="[isPositive('Maximum Discount Amount')]"
                >
                  <money3
                      v-model.number="voucherForm.maxDiscountAmount"
                      v-bind="{
                                precision: 0,
                                allowBlank: true
                            }"
                  />
                </va-input>
              </div>
            </div>

            <div class="form-section mt-6">
              <h3 class="text-lg font-semibold mb-4">Order Limits (Optional)</h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <va-input
                    v-model="voucherForm.minOrderAmount"
                    label="Minimum Order Value"
                    placeholder="Minimum order amount to apply voucher"
                    :rules="[isPositive('Minimum Order Value')]"
                >
                  <money3
                      v-model.number="voucherForm.minOrderAmount"
                      v-bind="{
                                precision: 0,
                                allowBlank: true
                            }"
                  />
                </va-input>

                <va-input
                    v-model="voucherForm.maxOrderAmount"
                    label="Maximum Order Value"
                    placeholder="Maximum order amount to apply voucher"
                    :rules="[isPositive('Maximum Order Value')]"
                >
                  <money3
                      v-model.number="voucherForm.maxOrderAmount"
                      v-bind="{
                                precision: 0,
                                allowBlank: true
                            }"
                  />
                </va-input>
              </div>
            </div>

            <div class="form-section mt-6">
              <h3 class="text-lg font-semibold mb-4">Availability</h3>

              <va-checkbox
                  v-model="voucherForm.status"
                  label="Voucher is active and available for use"
                  color="#4318FF"
              />
            </div>
          </va-form>
        </div>
      </div>

      <div class="form-actions mt-6 flex items-center justify-end">
        <va-button
            flat
            class="mr-4"
            @click="handleCancel"
            :disabled="mutation.isPending.value"
        >
          Back
        </va-button>
        <va-button
            @click="handleSubmit"
            :loading="mutation.isPending.value"
            color="primary"
            gradient
        >
          Update Voucher
        </va-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.voucher-page {
  animation: fadeIn 0.3s ease-in-out;
}

.voucher-card {
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.voucher-card:hover {
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.08);
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  text-align: center;
}

.form-section {
  padding: 0 0 16px 0;
  border-bottom: 1px solid #eee;
}

.form-section:last-child {
  border-bottom: none;
}

.card-content {
  min-height: 300px;
}

.form-actions {
  padding-top: 16px;
  border-top: 1px solid #eee;
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
  .form-actions {
    flex-direction: column;
  }

  .form-actions .va-button {
    width: 100%;
    margin-right: 0;
    margin-bottom: 12px;
  }
}
</style>
