<script setup>
import {computed, ref, watch} from 'vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  imageUrl: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: 'Image Preview'
  },
  imageName: {
    type: String,
    default: ''
  },
  allowZoom: {
    type: Boolean,
    default: true
  },
  modalSize: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large', 'xlarge'].includes(value)
  },

  imageWidth: {
    type: Number,
    default: 400
  },
  imageHeight: {
    type: Number,
    default: 300
  }
});

const emit = defineEmits(['update:visible']);

const zoom = ref(1);
const maxZoom = 3;
const minZoom = 0.5;
const zoomStep = 0.25;

const viewportHeightConstraint = computed(() => {
  return Math.min(window.innerHeight * 0.7, 600) + 'px';
});

const imageDimensions = computed(() => {
  if (zoom.value === 1) {
    return {
      width: `${props.imageWidth}px`,
      height: `${props.imageHeight}px`
    };
  } else {

    return {
      width: `${props.imageWidth * zoom.value}px`,
      height: `${props.imageHeight * zoom.value}px`,
      transform: `scale(${zoom.value})`
    };
  }
});

const zoomIn = () => {
  if (zoom.value < maxZoom) {
    zoom.value += zoomStep;
  }
};

const zoomOut = () => {
  if (zoom.value > minZoom) {
    zoom.value -= zoomStep;
  }
};

const resetZoom = () => {
  zoom.value = 1;
};

const closeModal = () => {
  emit('update:visible', false);

  zoom.value = 1;
};

watch(() => props.visible, (newValue) => {
  if (newValue === false) {
    resetZoom();
  }
});
</script>

<template>
  <VaModal
      style="z-index: 9999 !important;"
      :modelValue="visible"
      @update:modelValue="closeModal"
      :class="['image-preview-modal', modalSize]"
      hide-default-actions
      :overlay-opacity="0.8"
      fixed
      stateful
      no-resize
  >
    <template #header>
      <div class="modal-header flex justify-between items-center p-4 border-b">
        <h3 class="text-lg font-semibold text-gray-800">{{ title }}</h3>
        <button
            class="modal-close-button text-gray-500 hover:text-gray-700"
            @click="closeModal"
        >
          <va-icon name="close"/>
        </button>
      </div>
    </template>

    <div class="image-preview-content">

      <div class="image-container">
        <div class="image-wrapper">
          <img
              :src="imageUrl"
              :alt="imageName || 'Image preview'"
              class="preview-image"
              :style="zoom === 1 ? { width: `${imageWidth}px`, height: `${imageHeight}px` } :
                   { width: `${imageWidth}px`, height: `${imageHeight}px`, transform: `scale(${zoom})` }"
          >
        </div>
      </div>

      <div class="controls-container p-4">

        <div v-if="imageName"
             class="image-name mb-3 px-3 py-2 bg-gray-100 rounded-full text-sm text-gray-700 text-center">
          <va-icon name="image" class="mr-1" size="small"/>
          {{ imageName }}
        </div>

        <div v-if="allowZoom" class="zoom-controls flex gap-2 justify-center">
          <va-button
              icon="zoom_out"
              size="small"
              preset="secondary"
              :disabled="zoom <= minZoom"
              @click="zoomOut"
              color="primary"
          />
          <va-button
              icon="restart_alt"
              size="small"
              preset="secondary"
              :disabled="zoom === 1"
              @click="resetZoom"
              color="primary"
          />
          <va-button
              icon="zoom_in"
              size="small"
              preset="secondary"
              :disabled="zoom >= maxZoom"
              @click="zoomIn"
              color="primary"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <slot name="footer"></slot>
    </template>
  </VaModal>
</template>

<style scoped>

.image-preview-modal {
  --modal-width-small: 400px;
  --modal-height-small: min(350px, 70vh);
  --modal-width-medium: 600px;
  --modal-height-medium: min(500px, 70vh);
  --modal-width-large: 800px;
  --modal-height-large: min(650px, 70vh);
  --modal-width-xlarge: 1000px;
  --modal-height-xlarge: min(800px, 70vh);

  --controls-height: 100px;
  --image-padding: 20px;
  --footer-height: 0px;
}

.image-preview-modal :deep(.va-modal__container) {
  width: var(--modal-width-medium) !important;
  height: var(--modal-height-medium) !important;
  max-width: var(--modal-width-medium) !important;
  max-height: 70vh !important;
  min-width: var(--modal-width-medium) !important;
  min-height: auto !important;
  box-sizing: border-box !important;
}

.image-preview-modal.small :deep(.va-modal__container) {
  width: var(--modal-width-small) !important;
  height: var(--modal-height-small) !important;
  max-width: var(--modal-width-small) !important;
  max-height: 70vh !important;
  min-width: var(--modal-width-small) !important;
  min-height: auto !important;
}

.image-preview-modal.medium :deep(.va-modal__container) {
  width: var(--modal-width-medium) !important;
  height: var(--modal-height-medium) !important;
  max-width: var(--modal-width-medium) !important;
  max-height: 70vh !important;
  min-width: var(--modal-width-medium) !important;
  min-height: auto !important;
}

.image-preview-modal.large :deep(.va-modal__container) {
  width: var(--modal-width-large) !important;
  height: var(--modal-height-large) !important;
  max-width: var(--modal-width-large) !important;
  max-height: 70vh !important;
  min-width: var(--modal-width-large) !important;
  min-height: auto !important;
}

.image-preview-modal.xlarge :deep(.va-modal__container) {
  width: var(--modal-width-xlarge) !important;
  height: var(--modal-height-xlarge) !important;
  max-width: var(--modal-width-xlarge) !important;
  max-height: 70vh !important;
  min-width: var(--modal-width-xlarge) !important;
  min-height: auto !important;
}

.image-preview-modal :deep(.va-modal__dialog) {
  height: 100% !important;
  width: 100% !important;
  display: flex !important;
  flex-direction: column !important;
  max-height: 70vh !important;
}

.image-preview-modal :deep(.va-modal__content) {
  flex: 1 !important;
  overflow: hidden !important;
  display: flex !important;
  flex-direction: column !important;
  padding: 0 !important;
}

.image-preview-modal :deep(.va-modal__footer) {
  min-height: 0;
  height: auto;
  padding: 0 !important;
}

.image-preview-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.image-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: calc(100% - var(--controls-height));
  padding: var(--image-padding);
  overflow: hidden;
}

.image-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

.preview-image {
  object-fit: contain;
  display: block;
  transition: transform 0.2s ease;
  transform-origin: center center;

}

.controls-container {
  height: var(--controls-height);
  min-height: var(--controls-height);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.image-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 90%;
  margin-left: auto;
  margin-right: auto;
}

@media (max-width: 768px) {
  .image-preview-modal :deep(.va-modal__container) {
    width: min(var(--modal-width-medium), 90vw) !important;
    height: min(var(--modal-height-medium), 70vh) !important;
    max-width: 90vw !important;
    max-height: 70vh !important;
    min-width: auto !important;
    min-height: auto !important;
  }

  .image-preview-modal.small :deep(.va-modal__container) {
    width: min(var(--modal-width-small), 90vw) !important;
    height: min(var(--modal-height-small), 70vh) !important;
  }

  .image-preview-modal.large :deep(.va-modal__container) {
    width: min(var(--modal-width-large), 90vw) !important;
    height: min(var(--modal-height-large), 70vh) !important;
  }

  .image-preview-modal.xlarge :deep(.va-modal__container) {
    width: min(var(--modal-width-xlarge), 90vw) !important;
    height: min(var(--modal-height-xlarge), 70vh) !important;
  }

  .image-preview-modal {
    --controls-height: 80px;
    --image-padding: 12px;
  }
}
</style>
