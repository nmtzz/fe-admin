<script setup>
import {computed, ref, watchEffect} from 'vue';
import {useToast} from 'vuestic-ui';
import ImagePreviewModal from './ImagePreviewModal.vue';

const props = defineProps({
  label: {
    type: String,
    default: 'Images'
  },
  required: {
    type: Boolean,
    default: false
  },
  maxSize: {
    type: Number,
    default: 5 * 1024 * 1024
  },
  maxFiles: {
    type: Number,
    default: 10
  },
  placeholderText: {
    type: String,
    default: 'No images uploaded'
  },
  buttonText: {
    type: String,
    default: 'Upload Images'
  },
  modelValue: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:modelValue']);

const localImages = ref([]);

watchEffect(() => {
  if (Array.isArray(props.modelValue)) {
    localImages.value = props.modelValue;
  }
});

const fileInput = ref(null);
const {notify} = useToast();
const previewModal = ref(false);
const selectedImage = ref(null);

const isMaxReached = computed(() => {
  return localImages.value.length >= props.maxFiles;
});

const handleUploadClick = () => {
  if (isMaxReached.value) {
    notify({
      message: `Maximum ${props.maxFiles} images allowed`,
      color: 'warning'
    });
    return;
  }
  fileInput.value.click();
};

const handleFileChange = (event) => {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  const remainingSlots = props.maxFiles - localImages.value.length;

  if (files.length > remainingSlots) {
    notify({
      message: `Only ${remainingSlots} more image(s) can be added`,
      color: 'warning'
    });
  }

  for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
    const file = files[i];

    if (file.size > props.maxSize) {
      notify({
        message: `Image ${file.name} exceeds size limit of ${props.maxSize / 1024 / 1024}MB`,
        color: 'danger'
      });
      continue;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const newImages = [...localImages.value, {
        url: e.target.result,
        fileName: file.name
      }];
      localImages.value = newImages;
      emit('update:modelValue', newImages);
    };
    reader.readAsDataURL(file);
  }

  event.target.value = null;
};

const removeImage = (index) => {
  const newImages = [...localImages.value];
  newImages.splice(index, 1);
  localImages.value = newImages;
  emit('update:modelValue', newImages);
};

const previewImage = (image) => {
  selectedImage.value = image;
  previewModal.value = true;
};
</script>

<template>
  <div class="image-list-component p-4 border border-dashed border-gray-300 rounded-lg">

    <div v-if="label" class="mb-4">
      <h3 class="text-lg font-medium text-gray-700">
        {{ label }} <span v-if="required" class="text-red-500">*</span>
      </h3>
    </div>

    <div v-if="localImages.length > 0" class="mb-4">
      <div class="image-grid">

        <div v-for="(image, index) in localImages" :key="index" class="image-item">

          <div class="image-preview relative" @click="previewImage(image)">
            <img :src="image.url" :alt="image.fileName" class="preview-img">

            <div
                @click.stop="removeImage(index)"
                class="delete-btn absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 cursor-pointer shadow hover:bg-red-600 z-10"
                title="Remove image"
            >
              <va-icon name="close" size="small"/>
            </div>
          </div>

          <div class="filename-text" :title="image.fileName">
            {{ image.fileName }}
          </div>
        </div>

        <div v-if="!isMaxReached" class="upload-placeholder" @click="handleUploadClick">
          <va-icon name="add_photo_alternate" size="large" class="text-gray-400"/>
          <div class="text-gray-500 text-sm mt-2">Add Image</div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state mb-4">
      <va-icon name="image" size="large" class="text-gray-400 mb-2"/>
      <p class="text-gray-500">{{ placeholderText }}</p>
    </div>

    <div class="text-center">
      <va-button @click="handleUploadClick" preset="secondary" :disabled="isMaxReached">
        <va-icon name="upload" class="mr-2"/>
        {{ buttonText }}
        <span v-if="maxFiles > 0" class="text-xs ml-1">
          ({{ localImages.length }}/{{ maxFiles }})
        </span>
      </va-button>
    </div>

    <input
        ref="fileInput"
        type="file"
        accept="image/*"
        multiple
        class="hidden"
        @change="handleFileChange"
    />

    <ImagePreviewModal
        v-model="previewModal"
        :image="selectedImage"
    />
  </div>
</template>

<style scoped>
.image-list-component {
  background-color: #fafafa;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
}

.image-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.image-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.image-preview:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
  overflow: hidden;
}

.delete-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.relative {
  position: relative;
}

.absolute {
  position: absolute;
}

.z-10 {
  z-index: 10;
}

.filename-text {
  font-size: 0.75rem;
  color: #666;
  margin-top: 4px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.upload-placeholder {
  aspect-ratio: 1/1;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-placeholder:hover {
  background-color: rgba(0, 0, 0, 0.02);
  border-color: var(--va-primary);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  background-color: #f9fafb;
  border-radius: 8px;
  text-align: center;
}

@media (max-width: 768px) {
  .image-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .image-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 8px;
  }
}
</style>
