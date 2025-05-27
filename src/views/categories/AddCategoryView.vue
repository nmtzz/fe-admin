<script setup>

import {ref} from "vue";
import {localeStore} from "@/stores/localeStore.js";
import {useForm, useToast, VaButton, VaCard, VaForm, VaInput} from "vuestic-ui";
import {minLength, requiredField} from "@/utils/validationUtil.js";
import {useMutation, useQueryClient} from "@tanstack/vue-query";
import axios from "axios";
import {useRouter} from "vue-router";

const category = ref({
  name: '',
})
const categoryTranslations = ref([])
const form = useForm('formRef')
localeStore.availableLocales.forEach(locale => {
  categoryTranslations.value.push({
    language: locale,
    translatedName: ''
  })
})
const queryClient = useQueryClient()
const {notify} = useToast()
const router = useRouter()
const mutation = useMutation({
  mutationFn: async (category) => {
    return await axios.post('/categories', category)
  },
  onSuccess: () => {
    queryClient.invalidateQueries({queryKey: ['categories']})
    notify({
      message: 'Category added successfully',
      color: 'success',
    })
    router.push('/categories')
  },
  onError: () => {
    notify({
      message: 'Failed to add category',
      color: 'danger',
    })
  }
})
const handleSubmit = () => {
  form.validate()
  if (!form.isValid.value) {
    return
  }
  const payload = {
    name: category.value.name,
    status: true,
    categoryTranslations: categoryTranslations.value.filter(translation => translation.translatedName)
  }
  mutation.mutate(payload)
}
</script>

<template>
  <div class="mb-4 flex justify-between items-center">
    <h1 class="text-2xl font-bold">Add Category</h1>
    <VaButton preset="secondary" icon="arrow_back" @click="$router.back()">Back</VaButton>
  </div>

  <VaCard class="p-6">
    <VaForm ref="formRef">
      <div class="mb-4">
        <div class="mb-4">
          <label class="uppercase text-xs font-semibold text-gray-600 mb-1 block">CATEGORY NAME (DEFAULT)</label>
          <VaInput
              :rules="[requiredField('Category Name'), minLength('Category Name', 3)]"
              v-model="category.name"
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
          <div v-for="translation in categoryTranslations" :key="translation.language" class="mb-3">
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
            :loading="mutation.isPending.value"
            :disabled="mutation.isPending.value"
            @click="handleSubmit"
            size="large"
            color="primary"
        >
          Save Category
        </VaButton>
      </div>
    </VaForm>
  </VaCard>
</template>
