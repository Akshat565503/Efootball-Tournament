<template>
  <div class="custom-select-wrapper relative w-full" ref="containerRef">
    <!-- Label -->
    <label v-if="label" class="block text-sm font-medium text-gray-400 mb-2">
      {{ label }}
    </label>

    <!-- Trigger Button -->
    <button
      type="button"
      @click="toggleDropdown"
      :disabled="disabled"
      class="w-full flex items-center justify-between px-4 py-3 rounded-xl text-left text-sm font-medium transition-all duration-200"
      :class="[
        isOpen 
          ? 'bg-glass-medium border-neon-green/60 shadow-neon-green ring-1 ring-neon-green/30 text-white' 
          : 'bg-glass-light border-glass-border hover:border-white/20 text-gray-200',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-glass-medium',
        'border backdrop-blur-md'
      ]"
    >
      <!-- Selected Display -->
      <div class="flex items-center gap-2.5 truncate">
        <span v-if="selectedOption?.icon" class="text-base shrink-0">{{ selectedOption.icon }}</span>
        <span v-if="selectedOption" class="truncate">{{ selectedOption.label }}</span>
        <span v-else class="text-gray-500 truncate">{{ placeholder || 'Select an option' }}</span>
      </div>

      <!-- Chevron Icon -->
      <svg
        class="w-4 h-4 text-gray-400 transition-transform duration-300 shrink-0 ml-2"
        :class="{ 'rotate-180 text-neon-green': isOpen }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <!-- Options Dropdown Menu -->
    <Transition name="dropdown">
      <div
        v-if="isOpen"
        class="absolute z-50 left-0 right-0 mt-2 py-1.5 rounded-xl bg-pitch-950/95 border border-glass-border shadow-glass-lg backdrop-blur-xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar"
      >
        <button
          v-for="option in normalizedOptions"
          :key="String(option.value)"
          type="button"
          @click="selectOption(option)"
          class="w-full px-4 py-2.5 flex items-center justify-between text-left text-sm transition-all duration-150 group"
          :class="[
            isSelected(option.value)
              ? 'bg-neon-green/15 text-neon-green font-semibold'
              : 'text-gray-300 hover:bg-white/10 hover:text-white'
          ]"
        >
          <div class="flex items-center gap-2.5 truncate">
            <span v-if="option.icon" class="text-base shrink-0">{{ option.icon }}</span>
            <span class="truncate">{{ option.label }}</span>
          </div>

          <!-- Active checkmark -->
          <svg
            v-if="isSelected(option.value)"
            class="w-4 h-4 text-neon-green shrink-0 ml-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
export interface SelectOption {
  label: string
  value: string | number
  icon?: string
}

const props = defineProps<{
  modelValue: string | number | undefined | null
  options: (SelectOption | string | number)[]
  label?: string
  placeholder?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
  (e: 'change', value: string | number): void
}>()

const isOpen = ref(false)
const containerRef = ref<HTMLElement>()

// Normalize options to { label, value, icon }
const normalizedOptions = computed<SelectOption[]>(() => {
  return props.options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return opt as SelectOption
    }
    return {
      label: String(opt),
      value: opt,
    }
  })
})

const selectedOption = computed(() => {
  return normalizedOptions.value.find((opt) => opt.value === props.modelValue)
})

function isSelected(value: string | number) {
  return props.modelValue === value
}

function toggleDropdown() {
  if (props.disabled) return
  isOpen.value = !isOpen.value
}

function selectOption(option: SelectOption) {
  emit('update:modelValue', option.value)
  emit('change', option.value)
  isOpen.value = false
}

// Click outside handler
function handleClickOutside(event: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}

/* Custom scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.02);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 9999px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
}
</style>
