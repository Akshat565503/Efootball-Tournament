<template>
  <div class="min-h-screen bg-pitch-950 flex items-center justify-center px-4 relative overflow-hidden">
    <!-- Background effects -->
    <div class="absolute inset-0 bg-gradient-radial from-pitch-800/20 via-transparent to-transparent"></div>
    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-10"
         style="background: radial-gradient(circle, rgba(57,255,20,0.15) 0%, transparent 70%);"></div>

    <div class="w-full max-w-md relative z-10">
      <!-- Logo -->
      <NuxtLink to="/" class="flex items-center justify-center gap-3 mb-8">
        <div class="w-10 h-10 rounded-lg bg-gradient-neon flex items-center justify-center">
          <span class="text-pitch-950 font-heading font-black text-xl">⚽</span>
        </div>
        <span class="font-heading font-bold text-2xl text-white">
          eFootball<span class="text-gradient-neon">Arena</span>
        </span>
      </NuxtLink>

      <slot />
    </div>
  </div>
</template>
