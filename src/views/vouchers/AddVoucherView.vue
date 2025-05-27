<script setup>
import {useMutation, useQueryClient} from '@tanstack/vue-query';
import axios from 'axios';
import {reactive} from 'vue';
import {useForm, useModal, useToast, VaInput} from 'vuestic-ui'
import {isPositive, lessThan, minLength, notZero, requiredField} from '@/utils/validationUtil'
import {useRouter} from 'vue-router';
import {formatDate, parseDate} from "@/utils/localeUtil.js";

const {confirm} = useModal()
const {notify} = useToast()
const queryClient = useQueryClient()
const router = useRouter();

const voucherFormRef = useForm('myVoucherFormRef')
const voucherForm = reactive({
  code: '',
  discountType: 'PERCENTAGE',
  discountAmount: 0,
  startDate: new Date(),
  endDate: new Date(),
  minOrderAmount: 0,
  maxOrderAmount: 0,
  maxDiscountAmount: 0,
  quantity: 100,
  status: true
})
const mutation = useMutation({
  mutationFn: async (voucher) => {
    return await axios.post('/vouchers', voucher)
  },
  onSuccess: () => {
    queryClient.invalidateQueries({queryKey: ['vouchers']})
    notify({
      message: 'Voucher added successfully',
      color: 'success',
    })
    resetForm()
    router.push('/vouchers')
  },
  onError: (error) => {
    notify({
      message: `Failed to add voucher: ${error.response?.data?.message || error.response?.data?.error || 'Unknown error'}`,
      color: 'danger',
    })
  }
})

const resetForm = () => {
  voucherForm.code = ''
  voucherForm.discountType = 'PERCENTAGE'
  voucherForm.discountAmount = 0
  voucherForm.startDate = new Date()
  voucherForm.endDate = new Date(new Date().setMonth(new Date().getMonth() + 1))
  voucherForm.minOrderAmount = null
  voucherForm.maxOrderAmount = null
  voucherForm.maxDiscountAmount = null
  voucherForm.quantity = 100
  voucherForm.status = true
  voucherFormRef.reset()
}

const validateDates = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(voucherForm.startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(voucherForm.endDate);
  end.setHours(0, 0, 0, 0);

  if (start < today) {
    notify({
      message: 'Start date cannot be in the past',
      color: 'warning',
    });
    return false;
  }

  if (start >= end) {
    notify({
      message: 'End date must be after start date',
      color: 'warning',
    });
    return false;
  }

  return true;
}

const validateDiscountValue = () => {
  if (voucherForm.discountAmount === null || voucherForm.discountAmount <= 0) {
    notify({
      message: 'Discount value must be greater than 0',
      color: 'warning',
    })
    return false
  }

  if (voucherForm.discountType === 'PERCENTAGE' && voucherForm.discountAmount > 100) {
    notify({
      message: 'Percentage discount cannot exceed 100%',
      color: 'warning',
    })
    return false
  }

  return true
}

const validateOrderValues = () => {
  if (voucherForm.minOrderAmount && voucherForm.maxOrderAmount) {
    if (parseFloat(voucherForm.minOrderAmount) >= parseFloat(voucherForm.maxOrderAmount)) {
      notify({
        message: 'Maximum order value must be greater than minimum order value',
        color: 'warning',
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
    title: 'Create Voucher',
    message: 'Are you sure you want to create this voucher?',
    okText: 'Create',
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

      if (formattedVoucher.maxDiscountAmount === null) delete formattedVoucher.maxDiscountAmount;
      if (formattedVoucher.minOrderAmount === null) delete formattedVoucher.minOrderAmount;
      if (formattedVoucher.maxOrderAmount === null) delete formattedVoucher.maxOrderAmount;

      mutation.mutate(formattedVoucher);
    }
  });
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

const isDateAllowed = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(date) >= today;
};

const isEndDateAllowed = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDate = new Date(date);
  const startDate = new Date(voucherForm.startDate);
  startDate.setHours(0, 0, 0, 0);

  return selectedDate >= today && selectedDate >= startDate;
};
</script>

<template>
  <div class="voucher-page">
    <div class="page-header mb-6">
      <h1 class="text-2xl font-bold">Add New Voucher</h1>
      <p class="text-gray-600 mt-2">Create a new discount voucher for your customers</p>
    </div>

    <div class="voucher-card bg-white p-6 rounded-lg">
      <div class="card-content">
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

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <va-date-input
                  v-model="voucherForm.startDate"
                  label="Start Date"
                  :rules="[requiredField('Start Date')]"
                  :format-date="formatDate"
                  :parse-date="parseDate"
                  :allowed-days="(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const selectedDate = new Date(date);
                      selectedDate.setHours(0, 0, 0, 0);
                      return selectedDate >= today;
                    }"
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
                  :label="'Discount Amount'"
                  :placeholder="'Enter discount Amount'"
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
                       :label="'Discount percentage (%)'"
                       :placeholder="'Enter discount percentage'"
                       type="number"
                       :min="1"
                       :max="100"
                       :rules="[notZero('Discount Value'), lessThan('Discount Value', 101)]"
              />
            </div>

            <div v-if="voucherForm.discountType === 'PERCENTAGE'" class="mb-4">
              <va-input
                  v-model="voucherForm.maxDiscountAmount"
                  label="Maximum Discount Amount (Optional)"
                  placeholder="Maximum amount to discount for percentage"
                  type="number"
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
                  type="number"
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
                  type="number"
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
        </va-form>
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
          Create Voucher
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
