<script setup>
import {computed, reactive, ref} from 'vue'
import {useMutation} from '@tanstack/vue-query'
import {useForm, useToast} from 'vuestic-ui'
import {minLength, requiredField} from '@/utils/validationUtil'
import {getLoggedInUser} from '@/services/authService'
import axios from 'axios'

const {notify} = useToast()
const {isValid, validate} = useForm('passwordFormRef')

const loggedInUser = getLoggedInUser()

const userRole = computed(() => {

  return loggedInUser?.role || ''
})

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

const changePasswordMutation = useMutation({
  mutationFn: async ({currentPassword, newPassword}) => {
    return await axios.patch('/users/change-password', null, {
      params: {
        oldPassword: currentPassword,
        newPassword: newPassword
      }
    })
  },
  onSuccess: () => {
    notify({
      message: 'Password changed successfully',
      color: 'success'
    })
    clearPasswordForm()
  },
  onError: () => {
    notify({
      message: 'Failed to change password',
      color: 'danger'
    })
  }
})

const handlePasswordChange = () => {
  validate()
  if (isValid.value) {
    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    })
  }
}

const clearPasswordForm = () => {
  passwordForm.currentPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  showCurrentPassword.value = false
  showNewPassword.value = false
  showConfirmPassword.value = false
}
</script>

<template>
  <div class="account-page">

    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">👤 Account Settings</h1>
      <p class="text-gray-600">Manage your account information and security settings</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center mb-6">
          <div class="p-3 bg-blue-100 rounded-lg">
            <va-icon name="person" size="large" class="text-blue-600"/>
          </div>
          <div class="ml-4">
            <h2 class="text-xl font-semibold text-gray-900">Profile Information</h2>
            <p class="text-gray-600">Your account details and information</p>
          </div>
        </div>

        <div class="space-y-4">

          <div class="flex items-center justify-between py-3 border-b border-gray-100">
            <div class="flex items-center">
              <va-icon name="badge" class="text-gray-500 mr-3"/>
              <span class="font-medium text-gray-700">User ID</span>
            </div>
            <span class="text-gray-900 font-semibold">#{{ loggedInUser?.id }}</span>
          </div>

          <div class="flex items-center justify-between py-3 border-b border-gray-100">
            <div class="flex items-center">
              <va-icon name="person_outline" class="text-gray-500 mr-3"/>
              <span class="font-medium text-gray-700">Full Name</span>
            </div>
            <span class="text-gray-900">{{ loggedInUser?.fullName }}</span>
          </div>

          <div class="flex items-center justify-between py-3 border-b border-gray-100">
            <div class="flex items-center">
              <va-icon name="email" class="text-gray-500 mr-3"/>
              <span class="font-medium text-gray-700">Email</span>
            </div>
            <span class="text-gray-900">{{ loggedInUser?.email }}</span>
          </div>

          <div class="flex items-center justify-between py-3 border-b border-gray-100">
            <div class="flex items-center">
              <va-icon name="admin_panel_settings" class="text-gray-500 mr-3"/>
              <span class="font-medium text-gray-700">Role</span>
            </div>
            <va-badge
                :text="userRole"
                :color="userRole === 'ADMIN' ? 'warning' : 'info'"
                class="role-badge"
            />
          </div>

          <div class="flex items-center justify-between py-3">
            <div class="flex items-center">
              <va-icon name="verified" class="text-gray-500 mr-3"/>
              <span class="font-medium text-gray-700">Status</span>
            </div>
            <va-badge text="Active" color="success" class="status-badge"/>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center mb-6">
          <div class="p-3 bg-orange-100 rounded-lg">
            <va-icon name="lock" size="large" class="text-orange-600"/>
          </div>
          <div class="ml-4">
            <h2 class="text-xl font-semibold text-gray-900">Change Password</h2>
            <p class="text-gray-600">Update your password to keep your account secure</p>
          </div>
        </div>

        <va-form ref="passwordFormRef" class="space-y-4">

          <div class="form-group">
            <va-input
                label="Current Password"
                v-model="passwordForm.currentPassword"
                :type="showCurrentPassword ? 'text' : 'password'"
                :rules="[requiredField('Current Password')]"
                placeholder="Enter your current password"
                class="form-input"
                icon="lock"
            >
              <template #appendInner>
                <va-icon
                    :name="showCurrentPassword ? 'visibility' : 'visibility_off'"
                    class="password-toggle"
                    @click="showCurrentPassword = !showCurrentPassword"
                />
              </template>
            </va-input>
          </div>

          <div class="form-group">
            <va-input
                label="New Password"
                v-model="passwordForm.newPassword"
                :type="showNewPassword ? 'text' : 'password'"
                :rules="[requiredField('New Password'), minLength('New Password', 3)]"
                placeholder="Enter your new password"
                class="form-input"
                icon="lock_outline"
            >
              <template #appendInner>
                <va-icon
                    :name="showNewPassword ? 'visibility' : 'visibility_off'"
                    class="password-toggle"
                    @click="showNewPassword = !showNewPassword"
                />
              </template>
            </va-input>
          </div>

          <div class="form-group">
            <va-input
                label="Confirm New Password"
                v-model="passwordForm.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                :rules="[
                requiredField('Confirm Password'),
                minLength('Confirm Password', 3),
                value => value === passwordForm.newPassword || 'Passwords do not match'
              ]"
                placeholder="Confirm your new password"
                class="form-input"
                icon="lock_outline"
            >
              <template #appendInner>
                <va-icon
                    :name="showConfirmPassword ? 'visibility' : 'visibility_off'"
                    class="password-toggle"
                    @click="showConfirmPassword = !showConfirmPassword"
                />
              </template>
            </va-input>
          </div>

          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <h4 class="text-sm font-medium text-blue-800 mb-2">Password Requirements:</h4>
            <ul class="text-sm text-blue-700 space-y-1">
              <li class="flex items-center">
                <va-icon name="check_circle" size="small" class="text-blue-600 mr-2"/>
                At least 3 characters long
              </li>
              <li class="flex items-center">
                <va-icon name="check_circle" size="small" class="text-blue-600 mr-2"/>
                Different from your current password
              </li>
            </ul>
          </div>

          <div class="flex justify-end mt-6">
            <va-button
                @click="handlePasswordChange"
                :loading="changePasswordMutation.isPending.value"
                color="primary"
                class="change-password-button"
                icon="security"
            >
              Change Password
            </va-button>
          </div>
        </va-form>
      </div>
    </div>

    <div class="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6 mt-8">
      <div class="flex items-start">
        <div class="p-2 bg-green-100 rounded-lg">
          <va-icon name="security" size="large" class="text-green-600"/>
        </div>
        <div class="ml-4">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">🔒 Security Tips</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div class="flex items-start">
              <va-icon name="check" size="small" class="text-green-600 mr-2 mt-0.5"/>
              <span>Use a strong, unique password</span>
            </div>
            <div class="flex items-start">
              <va-icon name="check" size="small" class="text-green-600 mr-2 mt-0.5"/>
              <span>Change your password regularly</span>
            </div>
            <div class="flex items-start">
              <va-icon name="check" size="small" class="text-green-600 mr-2 mt-0.5"/>
              <span>Don't share your credentials</span>
            </div>
            <div class="flex items-start">
              <va-icon name="check" size="small" class="text-green-600 mr-2 mt-0.5"/>
              <span>Log out when finished</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.account-page {
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

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 600;
  color: #4A5568;
}

.form-input {
  width: 100%;
}

.password-toggle {
  cursor: pointer;
  color: #718096;
  transition: color 0.2s;
}

.password-toggle:hover {
  color: #4318FF;
}

.role-badge,
.status-badge {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.25rem 0.5rem;
}

.change-password-button {
  height: 48px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.change-password-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.bg-white {
  transition: all 0.3s ease;
}

.bg-white:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

@media (max-width: 1024px) {
  .grid.lg\\:grid-cols-2 {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .text-3xl {
    font-size: 1.875rem;
  }

  .grid.md\\:grid-cols-2 {
    grid-template-columns: 1fr;
  }
}

.va-icon {
  transition: color 0.2s ease;
}

.bg-gradient-to-r {
  background: linear-gradient(to right, #f0fdf4, #eff6ff);
}
</style>
