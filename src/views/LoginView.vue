<script setup>
import {useForm} from 'vuestic-ui'
import {requiredField} from '@/utils/validationUtil'
import {reactive, ref} from 'vue'
import {useLoginMutation} from '@/services/authService'

const {isValid, validate} = useForm('loginFormRef')
const loginForm = reactive({
  email: '',
  password: '',
})
const showPassword = ref(false)
const loginMutation = useLoginMutation()

const handleLogin = () => {
  validate()
  if (isValid.value) {
    loginMutation.mutate(loginForm)
  }
}

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

</script>
<template>
  <div class="login-container">
    <div class="login-card-wrapper">
      <va-card class="login-card">
        <div class="login-header">
          <div class="logo-container">
            <va-icon name="dashboard" size="large" class="logo-icon"/>
            <h1 class="company-name">Admin Dashboard</h1>
          </div>
          <h2 class="login-title">Sign In</h2>
          <p class="login-subtitle">Enter your credentials to access your account</p>
        </div>

        <VaForm ref="loginFormRef" class="login-form">
          <div class="form-group">
            <label class="form-label">Email</label>
            <VaInput v-model="loginForm.email" :rules="[requiredField('Email')]"
                     placeholder="Enter your email" class="form-input" icon="email"/>
          </div>

          <div class="form-group">
            <div class="password-label-row">
              <label class="form-label">Password</label>
              <a href="#" class="forgot-password">Forgot password?</a>
            </div>
            <VaInput v-model="loginForm.password" :type="showPassword ? 'text' : 'password'"
                     :rules="[requiredField('Password')]" placeholder="Enter your password" class="form-input"
                     icon="lock">
              <template #appendInner>
                <va-icon :name="showPassword ? 'visibility' : 'visibility_off'" class="password-toggle"
                         @click="togglePasswordVisibility"/>
              </template>
            </VaInput>
          </div>

          <VaButton @click="handleLogin" class="login-button" :loading="loginMutation.isPending.value"
                    color="#4318FF" gradient>
            Sign In
          </VaButton>
        </VaForm>
      </va-card>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
  padding: 20px;
}

.login-card-wrapper {
  width: 100%;
  max-width: 450px;
  animation: fadeIn 0.5s ease-in-out;
}

.login-card {
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.3s ease;
}

.login-card:hover {
  transform: translateY(-5px);
}

.login-header {
  padding: 24px 24px 0;
  text-align: center;
}

.logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.logo-icon {
  color: #4318FF;
  font-size: 32px;
  margin-right: 10px;
}

.company-name {
  font-size: 24px;
  font-weight: 700;
  color: #2D3748;
  margin: 0;
}

.login-title {
  font-size: 24px;
  font-weight: 700;
  color: #2D3748;
  margin: 0 0 8px;
}

.login-subtitle {
  font-size: 14px;
  color: #718096;
  margin: 0 0 24px;
}

.login-form {
  padding: 0 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
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

.password-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.forgot-password {
  font-size: 12px;
  color: #4318FF;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}

.forgot-password:hover {
  color: #2D3748;
  text-decoration: underline;
}

.password-toggle {
  cursor: pointer;
  color: #718096;
  transition: color 0.2s;
}

.password-toggle:hover {
  color: #4318FF;
}

.remember-me {
  display: flex;
  align-items: center;
}

.login-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  margin-top: 8px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(67, 24, 255, 0.3);
}

.signup-prompt {
  text-align: center;
  font-size: 14px;
  color: #718096;
  margin-top: 16px;
}

.signup-link {
  color: #4318FF;
  font-weight: 600;
  text-decoration: none;
  margin-left: 4px;
  transition: color 0.2s;
}

.signup-link:hover {
  color: #2D3748;
  text-decoration: underline;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 480px) {
  .login-card-wrapper {
    max-width: 100%;
  }

  .login-header {
    padding: 20px 20px 0;
  }

  .login-form {
    padding: 0 20px 20px;
  }

  .login-title {
    font-size: 22px;
  }

  .company-name {
    font-size: 20px;
  }

  .logo-icon {
    font-size: 28px;
  }
}
</style>
