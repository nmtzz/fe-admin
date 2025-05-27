<script setup>

import {computed, ref, watch} from "vue";
import {localeStore} from "@/stores/localeStore.js";
import {
  useForm,
  useModal,
  useToast,
  VaButton,
  VaCard,
  VaDivider,
  VaForm,
  VaInput,
  VaProgressCircle,
  VaSwitch
} from "vuestic-ui";
import {minLength, requiredField} from "@/utils/validationUtil.js";
import {useMutation, useQuery, useQueryClient} from "@tanstack/vue-query";
import axios from "axios";
import {useRoute, useRouter} from "vue-router";

const queryClient = useQueryClient()
const {notify} = useToast()
const router = useRouter()
const mutation = useMutation({
  mutationFn: async (category) => {
    return await axios.put('/categories', category)
  },
  onSuccess: () => {
    queryClient.invalidateQueries()
    notify({
      message: 'Category saved successfully',
      color: 'success',
    })
    router.push('/categories')
  },
  onError: () => {
    notify({
      message: 'Failed to save category',
      color: 'danger',
    })
  }
})
const {confirm} = useModal()
const handleSubmit = () => {
  form.validate()
  if (!form.isValid.value) {
    return
  }
  confirm({
    title: 'Save Category',
    message: 'Are you sure you want to save this category?',
    okText: 'Save',
    cancelText: 'Cancel',
    child: {
      okButton: {
        color: 'primary'
      }
    }
  }).then((confirmed) => {
    if (confirmed) {
      editingCategory.value.categoryTranslations = editingCategory.value.categoryTranslations.filter(translation => translation.translatedName)
      mutation.mutate(editingCategory.value)
    }
  })
}
const route = useRoute()
const categoryId = route.params.categoryId
const form = useForm('formRef')
const editingCategory = ref({
  name: '',
  status: true,
  categoryTranslations: []
})
const {data: categoryData, isPending: isCategoryLoading, isError: isCategoryError} = useQuery({
  queryKey: [`categories/${categoryId}`],
  queryFn: async () => {
    const {data} = await axios.get(`/categories/${categoryId}`)
    return data
  },
  enabled: computed(() => !!categoryId)
})
watch(() => categoryData.value, (data) => {
  if (data && data.result) {
    editingCategory.value = {
      ...data.result,
      categoryTranslations: [...data.result.categoryTranslations]
    }
    const set = new Set(editingCategory.value.categoryTranslations.map(translation => translation.language))
    localeStore.availableLocales.forEach(locale => {
      if (!set.has(locale)) {
        editingCategory.value.categoryTranslations.push({
          language: locale,
          translatedName: ''
        })
      }
    })
    console.log(editingCategory.value)
  }
}, {immediate: true})
</script>

<template>
  <div class="mb-4 flex justify-between items-center">
    <h1 class="text-2xl font-bold">Edit Category</h1>
    <VaButton preset="secondary" icon="arrow_back" @click="$router.back()">Back</VaButton>
  </div>

  <VaCard class="p-6">
    <div v-if="isCategoryLoading" class="flex justify-center items-center py-8">
      <VaProgressCircle indeterminate/>
    </div>

    <div v-else-if="isCategoryError" class="text-center py-8 text-danger">
      Error loading category data. Please try again.
    </div>

    <VaForm v-else ref="formRef">
      <div class="mb-4">
        <VaSwitch
            v-model="editingCategory.status"
            true-inner-label="Active"
            false-inner-label="Inactive"
            true-color="success"
            false-color="danger"
            class="mb-2"
        />
        <div class="text-gray-700">
          <span v-if="editingCategory.status">Category is active and visible to customers</span>
          <span v-else>Category is inactive and hidden from customers</span>
        </div>
      </div>

      <VaDivider class="my-4"/>

      <div class="mb-4">
        <div class="mb-4">
          <label class="uppercase text-xs font-semibold text-gray-600 mb-1 block">CATEGORY NAME (DEFAULT)</label>
          <VaInput
              :rules="[requiredField('Category Name'), minLength('Category Name', 3)]"
              v-model="editingCategory.name"
              class="mb-3"
          />
        </div>

        <h4 class="text-lg font-medium mb-2">Translations</h4>

        <div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div class="flex items-center mb-2">
            <va-icon name="language" class="mr-2 text-blue-600"/>
            <span class="text-sm font-medium text-blue-800">Available Languages</span>
          </div>
          <div class="flex flex-wrap gap-2">
            <div
                v-for="annotationLocale in localeStore.annotationLocales"
                :key="annotationLocale.locale"
                class="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
            >
              <span class="uppercase font-bold mr-1">{{ annotationLocale.locale }}</span>
              <span>{{ annotationLocale.annotation }}</span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-for="translation in editingCategory.categoryTranslations" :key="translation.language" class="mb-3">
            <label class="uppercase text-xs font-semibold text-gray-600 mb-1 block">
              CATEGORY NAME ({{ translation.language }})
            </label>
            <VaInput
                :rules="[minLength(`Category Name (${translation.language})`, 3)]"
                v-model="translation.translatedName"
            />
          </div>
        </div>
      </div>

      <div class="mt-6 flex justify-end">
        <VaButton
            color="primary"
            :loading="mutation.isPending.value"
            :disabled="mutation.isPending.value"
            @click="handleSubmit"
            size="large"
        >
          Save Changes
        </VaButton>
      </div>
    </VaForm>
  </VaCard>
</template>
