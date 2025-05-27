<script setup>
import {localeStore} from "@/stores/localeStore.js";
import {computed, ref} from "vue";
import {useMutation, useQuery} from "@tanstack/vue-query";
import {useToast} from "vuestic-ui";
import axios from "axios";
import Thumbnail from "@/components/Thumbnail.vue";
import ImageListComponent from "@/components/ImageListComponent.vue";
import {useRouter} from "vue-router";
import uploadToCloudinary from "@/services/cloudinaryService.js";

const router = useRouter();
const {notify} = useToast();
const activeTab = ref('');

const product = ref({
  name: '',
  description: '',
  brand: '',
  price: 0,
  status: true,
  categoryId: null,
  sku: '',
  stock: 0
});

const productSpecs = ref([
  {key: '', value: ''}
]);

const hasEmptySpecs = computed(() => {
  return productSpecs.value.some(spec =>
      (spec.key.trim() !== '' && spec.value.trim() === '') ||
      (spec.key.trim() === '' && spec.value.trim() !== '')
  );
});

const hasDuplicateSpecKeys = computed(() => {
  const keys = productSpecs.value
      .map(spec => spec.key.trim())
      .filter(key => key !== '');
  return new Set(keys).size !== keys.length;
});

const isSpecKeyDuplicate = (currentKey, currentIndex) => {
  if (!currentKey.trim()) return false;

  return productSpecs.value.some((spec, index) =>
      spec.key.trim() === currentKey.trim() && index !== currentIndex
  );
};

const isKeyEmptyWithValue = (spec) => {
  return spec.key.trim() === '' && spec.value.trim() !== '';
};

const isValueEmptyWithKey = (spec) => {
  return spec.key.trim() !== '' && spec.value.trim() === '';
};

const addSpecification = () => {

  const hasIncompleteSpecs = productSpecs.value.some(spec =>
      spec.key.trim() === '' ||
      spec.value.trim() === '' ||
      isSpecKeyDuplicate(spec.key, productSpecs.value.indexOf(spec))
  );

  if (hasIncompleteSpecs) {
    notify({
      message: 'Please complete all existing specifications before adding a new one',
      color: 'warning'
    });
    return;
  }

  productSpecs.value.push({key: '', value: ''});
};

const removeSpecification = (index) => {
  productSpecs.value.splice(index, 1);
};

const thumbnail = ref(null);
const productImages = ref([]);

const productTranslations = ref([]);
localeStore.availableLocales.forEach(locale => {
  productTranslations.value.push({
    language: locale,
    translatedName: '',
    translatedDescription: '',
    translatedSpecs: {
      items: []
    }
  });

  if (activeTab.value === '') {
    activeTab.value = locale;
  }
});

const hasEmptyTranslationSpecs = (translation) => {
  return translation.translatedSpecs.items.some(spec =>
      (spec.key.trim() !== '' && spec.value.trim() === '') ||
      (spec.key.trim() === '' && spec.value.trim() !== '')
  );
};

const hasDuplicateTranslationSpecKeys = (translation) => {
  const keys = translation.translatedSpecs.items
      .map(spec => spec.key.trim())
      .filter(key => key !== '');
  return new Set(keys).size !== keys.length;
};

const isTranslationSpecKeyDuplicate = (translation, currentKey, currentIndex) => {
  if (!currentKey.trim()) return false;

  return translation.translatedSpecs.items.some((spec, index) =>
      spec.key.trim() === currentKey.trim() && index !== currentIndex
  );
};

const isTranslationKeyEmptyWithValue = (spec) => {
  return spec.key.trim() === '' && spec.value.trim() !== '';
};

const isTranslationValueEmptyWithKey = (spec) => {
  return spec.key.trim() !== '' && spec.value.trim() === '';
};

const addTranslationSpec = (translation) => {

  const hasIncompleteSpecs = translation.translatedSpecs.items.some(spec =>
      spec.key.trim() === '' ||
      spec.value.trim() === '' ||
      isTranslationSpecKeyDuplicate(translation, spec.key, translation.translatedSpecs.items.indexOf(spec))
  );

  if (hasIncompleteSpecs) {
    notify({
      message: `Please complete all existing ${translation.language} specifications before adding a new one`,
      color: 'warning'
    });
    return;
  }

  translation.translatedSpecs.items.push({key: '', value: ''});
};

const addNewTranslationSpecKey = (newKey, translation, index) => {
  if (!newKey || newKey.trim() === '') {
    notify({
      message: 'Specification key cannot be empty',
      color: 'warning'
    });
    return;
  }

  translation.translatedSpecs.items[index].key = newKey;
};

const addNewTranslationSpecValue = (newValue, translation, index) => {
  if (!newValue || newValue.trim() === '') {
    notify({
      message: 'Specification value cannot be empty',
      color: 'warning'
    });
    return;
  }

  translation.translatedSpecs.items[index].value = newValue;
};

const changeTranslationTab = (newTab) => {
  activeTab.value = newTab;
};

const {data: categories, isPending: isCategoriesLoading} = useQuery({
  queryKey: ['categories'],
  queryFn: async () => {
    const {data} = await axios.get('/categories');
    return data?.result?.filter(category => category.status) || [];
  }
});

const {data: availableBrands, isPending: isBrandsLoading} = useQuery({
  queryKey: ['brands'],
  queryFn: async () => {
    const {data} = await axios.get('/products/brands');
    return data.result || [];
  }
});

const formattedBrands = computed(() => {
  if (!availableBrands.value || !Array.isArray(availableBrands.value)) return [];

  return [...new Set(availableBrands.value)]
      .filter(brand => brand && brand.trim() !== '')
      .sort((a, b) => a.localeCompare(b));
});

const {data: existingSpecsData, isPending: isSpecsLoading} = useQuery({
  queryKey: ['specs'],
  queryFn: async () => {
    const {data} = await axios.get('/products/specs');
    return data.result || [];
  }
});

const existingSpecs = computed(() => {
  const result = {
    keys: new Set(),
    keyValueMap: {}
  };

  if (!existingSpecsData.value || !Array.isArray(existingSpecsData.value)) {
    return result;
  }

  existingSpecsData.value.forEach(specJson => {
    try {
      if (specJson) {
        const specObj = JSON.parse(specJson);

        Object.entries(specObj).forEach(([key, value]) => {
          if (key && key.trim() !== '') {

            result.keys.add(key);

            if (!result.keyValueMap[key]) {
              result.keyValueMap[key] = new Set();
            }

            if (value && value.toString().trim() !== '') {
              result.keyValueMap[key].add(value.toString());
            }
          }
        });
      }
    } catch (e) {
      console.error('Error parsing specification JSON:', e);
    }
  });

  return {
    keys: [...result.keys].sort(),
    keyValueMap: Object.fromEntries(
        Object.entries(result.keyValueMap).map(([key, valueSet]) =>
            [key, [...valueSet].sort()]
        )
    )
  };
});

const getValuesForKey = (key) => {
  if (!key || !existingSpecs.value.keyValueMap[key]) {
    return [];
  }
  return existingSpecs.value.keyValueMap[key];
};

const fetchLanguageSpecs = (language) => {
  return axios.get(`/products/specs/${language}`)
      .then(({data}) => {
        const result = {
          keys: new Set(),
          keyValueMap: {}
        };

        if (!data.result || !Array.isArray(data.result)) {
          return result;
        }

        data.result.forEach(specJson => {
          try {
            if (specJson) {
              const specObj = JSON.parse(specJson);

              Object.entries(specObj).forEach(([key, value]) => {
                if (key && key.trim() !== '') {

                  result.keys.add(key);

                  if (!result.keyValueMap[key]) {
                    result.keyValueMap[key] = new Set();
                  }

                  if (value && value.toString().trim() !== '') {
                    result.keyValueMap[key].add(value.toString());
                  }
                }
              });
            }
          } catch (e) {
            console.error(`Error parsing ${language} specification JSON:`, e);
          }
        });

        return {
          keys: [...result.keys].sort(),
          keyValueMap: Object.fromEntries(
              Object.entries(result.keyValueMap).map(([key, valueSet]) =>
                  [key, [...valueSet].sort()]
              )
          )
        };
      })
      .catch(error => {
        console.error(`Error fetching ${language} specs:`, error);
        return {keys: [], keyValueMap: {}};
      });
};

const languageSpecs = ref({});

const getLanguageSpecs = async (language) => {

  if (!languageSpecs.value[language]) {
    languageSpecs.value[language] = await fetchLanguageSpecs(language);
  }

  return languageSpecs.value[language];
};

const preloadLanguageSpecs = async () => {
  for (const locale of localeStore.availableLocales) {
    await getLanguageSpecs(locale);
  }
};

preloadLanguageSpecs();

const addNewBrand = (newBrand) => {

  if (!newBrand || newBrand.trim() === '') {
    notify({
      message: 'Brand name cannot be empty',
      color: 'warning'
    });
    return;
  }

  if (formattedBrands.value.some(brand =>
      brand.toLowerCase() === newBrand.toLowerCase()
  )) {
    notify({
      message: `Brand "${newBrand}" already exists`,
      color: 'info'
    });
    product.value.brand = newBrand;
    return;
  }

  product.value.brand = newBrand;

  notify({
    message: `New brand "${newBrand}" will be created`,
    color: 'success'
  });
};

const addNewSpecKey = (newKey, index) => {
  if (!newKey || newKey.trim() === '') {
    notify({
      message: 'Specification key cannot be empty',
      color: 'warning'
    });
    return;
  }

  productSpecs.value[index].key = newKey;
};

const addNewSpecValue = (newValue, index) => {
  if (!newValue || newValue.trim() === '') {
    notify({
      message: 'Specification value cannot be empty',
      color: 'warning'
    });
    return;
  }

  productSpecs.value[index].value = newValue;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const isFormValid = computed(() => {
  return product.value.name &&
      product.value.price &&
      product.value.categoryId &&
      thumbnail.value &&
      product.value.sku.trim() !== '' &&
      product.value.stock > 0;
});

const productMutation = useMutation({
  mutationFn: async (productData) => {

    const uploadedImages = await processAndUploadImages();

    const finalPayload = {
      ...productData,
      thumbnail: uploadedImages.thumbnail,
      productImages: uploadedImages.productImages.map((url) => ({
        url
      }))
    };

    const {data} = await axios.post('/products', finalPayload);
    return data;
  },
  onSuccess: (data) => {
    notify({
      message: 'Product created successfully!',
      color: 'success'
    });
    router.push('/products');
  },
  onError: (error) => {
    notify({
      message: `Error creating product: ${error.response?.data?.message || error.message}`,
      color: 'danger'
    });
  }
});

const submitForm = () => {
  if (!isFormValid.value) {
    notify({
      message: 'Please fill all required fields',
      color: 'warning'
    });
    return;
  }

  if (hasEmptySpecs.value) {
    notify({
      message: 'Please complete all specifications with both key and value',
      color: 'warning'
    });
    return;
  }

  const invalidTranslation = productTranslations.value.find(
      translation => hasEmptyTranslationSpecs(translation) || hasDuplicateTranslationSpecKeys(translation)
  );

  if (invalidTranslation) {
    notify({
      message: `Please fix specification issues in ${invalidTranslation.language} translation`,
      color: 'warning'
    });

    activeTab.value = invalidTranslation.language;
    return;
  }

  const specsObject = {};
  productSpecs.value.forEach(spec => {
    if (spec.key.trim() && spec.value.trim()) {
      specsObject[spec.key.trim()] = spec.value.trim();
    }
  });

  const productData = {
    ...product.value,
    specs: JSON.stringify(specsObject),
    productTranslations: productTranslations.value.filter(translation =>
        translation.translatedName || translation.translatedDescription || translation.translatedSpecs.items.length > 0
    ).map(translation => {

      const specsObject = {};
      translation.translatedSpecs.items.forEach(spec => {
        if (spec.key.trim() && spec.value.trim()) {
          specsObject[spec.key.trim()] = spec.value.trim();
        }
      });

      return {
        language: translation.language,
        translatedName: translation.translatedName,
        translatedDescription: translation.translatedDescription,
        translatedSpecs: JSON.stringify(specsObject)
      };
    }),
    category: {
      id: typeof product.value.categoryId === 'object' ? product.value.categoryId.value : product.value.categoryId
    }
  };

  delete productData.categoryId;

  console.log('%c PRODUCT DATA BEFORE IMAGE UPLOAD', 'background: #4c1d95; color: #ffffff; font-size: 16px; font-weight: bold; padding: 4px 8px; border-radius: 4px;');
  console.log(JSON.stringify(productData, null, 2));

  productMutation.mutate(productData);
};

const processAndUploadImages = async () => {
  try {

    let thumbnailUrl = '';
    if (thumbnail.value && thumbnail.value.url) {

      if (thumbnail.value.url.startsWith('data:')) {
        const file = await base64ToFile(thumbnail.value.url, `thumbnail_${Date.now()}.jpg`);
        thumbnailUrl = await uploadToCloudinary(file);
      } else {

        thumbnailUrl = thumbnail.value.url;
      }
    }

    const productImageUrls = [];
    for (const image of productImages.value) {
      if (image.url) {

        if (image.url.startsWith('data:')) {
          const file = await base64ToFile(image.url, `product_image_${Date.now()}.jpg`);
          const url = await uploadToCloudinary(file);
          productImageUrls.push(url);
        } else {

          productImageUrls.push(image.url);
        }
      }
    }

    return {
      thumbnail: thumbnailUrl,
      productImages: productImageUrls
    };
  } catch (error) {
    console.error('Error uploading images:', error);
    throw error;
  }
};

const base64ToFile = async (base64, fileName) => {
  const response = await fetch(base64);
  const blob = await response.blob();
  return new File([blob], fileName, {type: blob.type});
};

const cancelForm = () => {
  router.push('/products');
};
</script>

<template>
  <va-card class="mb-6">
    <va-card-title>Add New Product</va-card-title>
    <va-card-content>
      <form @submit.prevent="submitForm">

        <h3 class="text-xl font-medium mb-4">Basic Information</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <va-input
              v-model="product.name"
              label="Product Name"
              placeholder="Enter product name"
              required
          />

          <va-select
              v-model="product.categoryId"
              label="Category"
              :options="categories instanceof Array ? categories : []"
              value-by="id"
              text-by="name"
              no-options-text="No categories found, go to categories to add one"
              placeholder="Select category"
              :loading="isCategoriesLoading"
              required
          />

          <va-select
              v-model="product.brand"
              label="Brand"
              :options="formattedBrands"
              placeholder="Select or enter brand name"
              :loading="isBrandsLoading"
              allow-create="unique"
              class="brand-select"
              noOptionsText="No brands found, enter to create a new one"
              @create-new="addNewBrand"
          />

          <va-input
              v-model="product.price"
              label="Price"
              placeholder="Enter price"
              required>
            <money3
                v-model.number="product.price"
                v-bind="{
                              precision: 0,
                              allowBlank: true
                          }"
            />
          </va-input>

          <va-input
              v-model="product.sku"
              label="SKU"
              placeholder="Enter product SKU"
              class="col-span-1"
              required
          />

          <va-input
              v-model="product.stock"
              label="Stock"
              type="number"
              min="0"
              placeholder="0"
              class="col-span-1"
              required
          />

          <va-textarea
              v-model="product.description"
              label="Description"
              placeholder="Enter product description"
              rows="3"
              class="col-span-1 md:col-span-2"
          />

          <div class="col-span-1 md:col-span-2">
            <div class="mb-4 flex justify-between items-center">
              <label class="text-lg font-medium text-gray-800">Specifications</label>
              <va-button
                  @click="addSpecification"
                  size="small"
                  preset="primary"
                  icon="add"
                  :disabled="hasEmptySpecs || hasDuplicateSpecKeys"
              >
                Add Specification
              </va-button>
            </div>

            <va-alert
                v-if="hasDuplicateSpecKeys"
                color="warning"
                class="mb-3"
            >
              <div class="flex items-center gap-2">
                <va-icon name="warning"/>
                <span>Duplicate specification keys detected. Each key must be unique.</span>
              </div>
            </va-alert>

            <va-alert
                v-if="hasEmptySpecs"
                color="warning"
                class="mb-3"
            >
              <div class="flex items-center gap-2">
                <va-icon name="warning"/>
                <span>Both key and value must be provided for each specification.</span>
              </div>
            </va-alert>

            <div v-if="productSpecs.length > 0"
                 class="specs-container border border-gray-200 rounded-lg overflow-hidden">
              <div v-for="(spec, index) in productSpecs" :key="index"
                   class="spec-row flex items-center p-2 hover:bg-gray-50 border-b border-gray-200 last:border-b-0">
                <div class="flex-1 pr-2">
                  <va-select
                      v-model="spec.key"
                      class="w-full"
                      placeholder="Specification Name"
                      :error="isSpecKeyDuplicate(spec.key, index) || isKeyEmptyWithValue(spec)"
                      :error-messages="isSpecKeyDuplicate(spec.key, index)
                                        ? 'Duplicate key'
                                        : isKeyEmptyWithValue(spec)
                                          ? 'Key is required'
                                          : undefined"
                      :options="Array.from(existingSpecs.keys)"
                      allow-create="unique"
                      :loading="isSpecsLoading"
                      noOptionsText="No specifications found, enter to create a new one"
                      @create-new="(newKey) => addNewSpecKey(newKey, index)"
                  />
                </div>
                <div class="flex-1 px-2">
                  <va-select
                      v-model="spec.value"
                      class="w-full"
                      placeholder="Specification Value"
                      :error="isValueEmptyWithKey(spec)"
                      :error-messages="isValueEmptyWithKey(spec) ? 'Value is required' : undefined"
                      :options="getValuesForKey(spec.key)"
                      allow-create="unique"
                      :disabled="!spec.key"
                      noOptionsText="No values found, enter to create a new one"
                      @create-new="(newValue) => addNewSpecValue(newValue, index)"
                  />
                </div>
                <div class="flex-shrink-0 pl-2">
                  <va-button
                      @click="removeSpecification(index)"
                      icon="delete"
                      preset="secondary"
                      color="danger"
                      size="small"
                      class="delete-spec-btn"
                  />
                </div>
              </div>
            </div>

            <div v-else class="border border-dashed rounded-lg p-6 text-center text-gray-500 mt-3">
              <p class="mb-2">No specifications added yet</p>
              <va-button
                  @click="addSpecification"
                  size="small"
                  preset="primary"
                  class="mt-2"
              >
                Add First Specification
              </va-button>
            </div>
          </div>
        </div>

        <h3 class="text-xl font-medium mb-4">Product Images</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div class="thumbnail-container">
            <Thumbnail
                v-model="thumbnail"
                label="Thumbnail"
                required
                :max-size="MAX_FILE_SIZE"
                width="w-30"
                height="h-30"
                objectFit="contain"
            />
          </div>

          <div>
            <ImageListComponent
                v-model="productImages"
                label="Product Images"
                :max-size="MAX_FILE_SIZE"
                :max-files="10"
            />
          </div>
        </div>

        <h3 class="text-xl font-medium mb-4">Translations</h3>

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

        <div class="p-4 bg-white border border-gray-200 rounded-lg mb-6">

          <div class="mb-6">
            <div class="tabs-container">
              <div class="border-b border-gray-200">
                <nav class="flex -mb-px" aria-label="Translations" role="tablist">
                  <button
                      v-for="translation in productTranslations"
                      :key="translation.language"
                      @click="changeTranslationTab(translation.language)"
                      type="button"
                      class="py-3 px-6 font-medium text-sm transition-colors duration-200 focus:outline-none focus:ring-0"
                      :class="[
                        activeTab === translation.language
                          ? 'border-b-2 border-indigo-700 text-indigo-700'
                          : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      ]"
                      :id="`tab-button-${translation.language}`"
                      :tabindex="activeTab === translation.language ? 0 : -1"
                      :aria-selected="activeTab === translation.language"
                      :aria-controls="`tab-${translation.language}`"
                      role="tab"
                  >
                    <div class="flex items-center">
                      {{ translation.language }}
                    </div>
                  </button>
                </nav>
              </div>
            </div>
          </div>

          <div
              v-for="translation in productTranslations"
              :key="translation.language"
              v-show="activeTab === translation.language"
              class="pt-4"
              :id="`tab-${translation.language}`"
              role="tabpanel"
              :aria-labelledby="`tab-button-${translation.language}`"
          >
            <div class="bg-gray-50 p-6 rounded-lg">
              <div class="flex items-center mb-4">
                <h3 class="text-lg font-medium text-indigo-700">{{ translation.language }} Translation</h3>
              </div>

              <va-input
                  v-model="translation.translatedName"
                  label="Product Name"
                  placeholder="Enter translated product name"
                  class="w-full mb-4"
              />

              <va-textarea
                  v-model="translation.translatedDescription"
                  label="Description"
                  placeholder="Enter translated description"
                  rows="3"
                  class="w-full mb-4"
              ></va-textarea>

              <div>
                <label class="block text-sm font-medium mb-2">Specifications</label>

                <div class="border border-gray-200 rounded-lg p-4 bg-white">

                  <div class="mb-4 flex justify-between items-center">
                    <span class="text-sm font-medium text-gray-700">Add specifications for {{
                        translation.language
                      }}</span>
                    <va-button
                        @click="addTranslationSpec(translation)"
                        size="small"
                        preset="primary"
                        icon="add"
                        :disabled="hasEmptyTranslationSpecs(translation) || hasDuplicateTranslationSpecKeys(translation)"
                    >
                      Add Specification
                    </va-button>
                  </div>

                  <va-alert
                      v-if="hasDuplicateTranslationSpecKeys(translation)"
                      color="warning"
                      class="mb-3"
                  >
                    <div class="flex items-center gap-2">
                      <va-icon name="warning"/>
                      <span>Duplicate specification keys detected. Each key must be unique.</span>
                    </div>
                  </va-alert>

                  <va-alert
                      v-if="hasEmptyTranslationSpecs(translation)"
                      color="warning"
                      class="mb-3"
                  >
                    <div class="flex items-center gap-2">
                      <va-icon name="warning"/>
                      <span>Both key and value must be provided for each specification.</span>
                    </div>
                  </va-alert>

                  <div v-if="translation.translatedSpecs.items.length > 0"
                       class="specs-container border border-gray-200 rounded-lg overflow-hidden">
                    <div
                        v-for="(spec, index) in translation.translatedSpecs.items"
                        :key="index"
                        class="spec-row flex items-center p-2 hover:bg-gray-50 border-b border-gray-200 last:border-b-0"
                    >
                      <div class="flex-1 pr-2">
                        <va-select
                            v-model="spec.key"
                            :placeholder="`Key in ${translation.language}`"
                            class="w-full"
                            :error="isTranslationSpecKeyDuplicate(translation, spec.key, index) || isTranslationKeyEmptyWithValue(spec)"
                            :error-messages="isTranslationSpecKeyDuplicate(translation, spec.key, index)
                                              ? 'Duplicate key'
                                              : isTranslationKeyEmptyWithValue(spec)
                                                ? 'Key is required'
                                                : undefined"
                            :options="languageSpecs[translation.language]?.keys || existingSpecs.keys"
                            allow-create="unique"
                            :loading="isSpecsLoading"
                            noOptionsText="No specifications found, enter to create a new one"
                            @create-new="(newKey) => addNewTranslationSpecKey(newKey, translation, index)"
                        />
                      </div>
                      <div class="flex-1 px-2">
                        <va-select
                            v-model="spec.value"
                            :placeholder="`Value in ${translation.language}`"
                            class="w-full"
                            :error="isTranslationValueEmptyWithKey(spec)"
                            :error-messages="isTranslationValueEmptyWithKey(spec) ? 'Value is required' : undefined"
                            :options="languageSpecs[translation.language]?.keyValueMap?.[spec.key] || []"
                            allow-create="unique"
                            :disabled="!spec.key"
                            noOptionsText="No values found, enter to create a new one"
                            @create-new="(newValue) => addNewTranslationSpecValue(newValue, translation, index)"
                        />
                      </div>
                      <div class="flex-shrink-0 pl-2">
                        <va-button
                            @click="translation.translatedSpecs.items.splice(index, 1)"
                            icon="delete"
                            preset="secondary"
                            color="danger"
                            size="small"
                            class="delete-spec-btn"
                        />
                      </div>
                    </div>
                  </div>

                  <div v-if="translation.translatedSpecs.items.length === 0"
                       class="border border-dashed rounded-lg p-6 text-center text-gray-500 mt-3">
                    <p class="mb-2">No specifications added for {{ translation.language }}</p>
                    <va-button
                        @click="translation.translatedSpecs.items.push({key: '', value: ''})"
                        size="small"
                        preset="primary"
                        class="mt-2"
                    >
                      Add First Specification
                    </va-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-8">
          <va-button
              @click="cancelForm"
              type="button"
              preset="secondary"
              class="text-indigo-700"
          >
            Cancel
          </va-button>

          <va-button
              @click="submitForm"
              :disabled="!isFormValid || productMutation.isPending.value"
              :loading="productMutation.isPending.value"
              preset="primary"
          >
            Save Product
          </va-button>
        </div>
      </form>
    </va-card-content>
  </va-card>
</template>

<style scoped>

.thumbnail-container :deep(.relative.mx-auto) {
  width: 120px !important;
  height: 120px !important;
  margin: 0 auto;
}

.thumbnail-container :deep(img) {
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.thumbnail-container :deep(img:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.brand-select :deep(.va-select-content) {
  min-width: 100%;
}

.brand-select :deep(.va-dropdown__content) {
  max-height: 250px;
  overflow-y: auto;
}

.brand-select :deep(.va-select__option) {
  padding: 8px 12px;
  font-size: 14px;
}

.specs-container {
  background-color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.spec-row {
  transition: background-color 0.2s ease;
}

.spec-row:hover .delete-spec-btn {
  opacity: 1;
}

.delete-spec-btn {
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

:deep(.va-select__value-container) {
  padding: 0.5rem 0.75rem;
}

:deep(.va-dropdown__content) {
  z-index: 1000;
}
</style>
