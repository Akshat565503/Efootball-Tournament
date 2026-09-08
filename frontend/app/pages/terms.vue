<template>
  <div class="pt-24 pb-16 px-4">
    <div class="max-w-4xl mx-auto glass-card-static p-8 sm:p-12">
      <h1 class="font-heading font-bold text-3xl sm:text-4xl text-white mb-2">Terms of Service</h1>
      <p class="text-xs text-gray-500 mb-8">Last updated: September 8, 2026</p>

      <div class="space-y-6 text-gray-300 text-sm leading-relaxed">
        <section>
          <h2 class="font-heading font-bold text-lg text-white mb-2">1. Tournament Fair Play</h2>
          <p>By participating in tournaments on eFootball Arena, players agree to compete fairly, report honest match scores, and adhere to the designated in-game match rules.</p>
        </section>

        <section>
          <h2 class="font-heading font-bold text-lg text-white mb-2">2. Organizer Responsibility</h2>
          <p>Tournament organizers are responsible for managing their brackets, setting honest match outcomes, and distributing any community rewards directly using verified eFootball™ Account IDs.</p>
        </section>

        <section>
          <h2 class="font-heading font-bold text-lg text-white mb-2">3. Prohibited Conduct</h2>
          <p>Cheating, exploiting bugs, harassment, or attempting to compromise the platform will result in immediate account termination.</p>
        </section>

        <section>
          <h2 class="font-heading font-bold text-lg text-white mb-2">4. Disclaimer</h2>
          <p>eFootball Arena is a community tournament bracket management platform. eFootball™ is a trademark of Konami Digital Entertainment. This platform is not officially affiliated with or endorsed by Konami.</p>
        </section>
      </div>

      <div class="mt-8 pt-6 border-t border-glass-border">
        <NuxtLink to="/" class="text-xs text-neon-green hover:underline">← Back to Arena</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Terms of Service — eFootball Arena' })
</script>
