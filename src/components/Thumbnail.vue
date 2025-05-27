<script setup>
import {ref} from 'vue';
import {useToast} from 'vuestic-ui';
import ImagePreviewModal from './ImagePreviewModal.vue';

const model = defineModel();
const fileInput = ref(null);
const {notify} = useToast();
const showPreviewModal = ref(false);

const props = defineProps({
  label: {
    type: String,
    default: 'Image'
  },
  required: {
    type: Boolean,
    default: false
  },
  maxSize: {
    type: Number,
    default: 5 * 1024 * 1024
  },
  placeholderText: {
    type: String,
    default: 'No image uploaded'
  },
  uploadButtonText: {
    type: String,
    default: 'Upload Image'
  },
  changeButtonText: {
    type: String,
    default: 'Change Image'
  },
  width: {
    type: String,
    default: 'w-40'
  },
  height: {
    type: String,
    default: 'h-40'
  },
  objectFit: {
    type: String,
    default: 'cover'
  },
  previewTitle: {
    type: String,
    default: ''
  }
});

const handleClick = () => {
  fileInput.value.click();
};

const handleChange = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  if (file.size > props.maxSize) {
    notify({
      message: `Image size exceeds ${props.maxSize / (1024 * 1024)}MB limit: ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
      color: 'danger'
    });
    event.target.value = null;
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    model.value = {
      url: e.target.result,
      fileName: file.name,
    };
  };
  reader.readAsDataURL(file);
};

const removeImage = () => {
  model.value = null;
  if (fileInput.value) {
    fileInput.value.value = null;
  }
};

const openPreview = () => {
  if (model.value && model.value.url) {
    showPreviewModal.value = true;
  }
};

const getPreviewTitle = () => {
  return props.previewTitle || props.label;
};
</script>

<template>
  <div class="thumbnail-component border border-dashed border-gray-300 rounded-lg p-4">
    <h3 v-if="label" class="text-lg font-medium mb-3 text-gray-700">
      {{ label }} <span v-if="required" class="text-red-500">*</span>
    </h3>

    <div class="flex flex-col items-center">

      <div v-if="model" class="w-full mb-4">
        <div :class="['relative mx-auto', width, height]">
          <img
              class="w-full h-full rounded-lg cursor-pointer shadow-sm hover:shadow-md transition-shadow"
              :class="objectFit === 'cover' ? 'object-cover' : 'object-contain'"
              :src="model.url"
              :alt="model.fileName || 'Image preview'"
              @click="openPreview"
          />
          <div
              @click="removeImage"
              class="delete-btn absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 cursor-pointer shadow hover:bg-red-600 z-10"
              title="Remove image"
          >
            <va-icon name="close" size="small"/>
          </div>
        </div>
        <p v-if="model.fileName" class="text-sm text-center text-gray-500 mt-2 truncate">{{ model.fileName }}</p>
      </div>

      <div v-else class="w-full flex flex-col items-center justify-center bg-gray-50 rounded-lg py-8">
        <va-icon name="image" size="large" class="text-gray-400 mb-2"/>
        <p class="text-gray-500 mb-4">{{ placeholderText }}</p>
      </div>

      <va-button
          @click="handleClick"
          preset="secondary"
          class="mt-3"
      >
        <va-icon name="upload" class="mr-2"/>
        {{ model ? changeButtonText : uploadButtonText }}
      </va-button>

      <input
          ref="fileInput"
          hidden
          accept="image/*"
          type="file"
          @change="handleChange"
      />

      <ImagePreviewModal
          v-model:visible="showPreviewModal"
          :imageUrl="model?.url"
          :imageName="model?.fileName"
          :title="getPreviewTitle()"
      />
    </div>
  </div>
</template>

<style scoped>
.thumbnail-component {
  transition: all 0.3s ease;
}

.thumbnail-component:hover {
  border-color: var(--va-primary);
}

.delete-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.z-10 {
  z-index: 10;
}
</style>
