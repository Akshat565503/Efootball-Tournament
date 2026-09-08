<template>
  <div class="pt-24 pb-16 px-4">
    <div class="max-w-4xl mx-auto glass-card-static p-8 sm:p-12">
      <h1 class="font-heading font-bold text-3xl sm:text-4xl text-white mb-2">Privacy Policy</h1>
      <p class="text-xs text-gray-500 mb-8">Last updated: September 8, 2026</p>

      <div class="space-y-6 text-gray-300 text-sm leading-relaxed">
        <section>
          <h2 class="font-heading font-bold text-lg text-white mb-2">1. Data We Collect</h2>
          <p>We collect only the minimum personal data required to provide knockout tournament management:</p>
          <ul class="list-disc pl-5 mt-2 space-y-1 text-gray-400">
            <li>Email address and authentication metadata (via Supabase Auth / Google OAuth).</li>
            <li>Public display username and optional avatar.</li>
            <li>eFootball™ in-game Account ID / IGN (used solely by tournament organizers for match verification and prize distribution).</li>
            <li>Optional gameplay preferences (favorite club, region).</li>
          </ul>
        </section>

        <section>
          <h2 class="font-heading font-bold text-lg text-white mb-2">2. How We Use Data</h2>
          <p>Your data is used strictly to authenticate your account, construct tournament brackets, track match scores, and deliver real-time tournament notifications.</p>
        </section>

        <section>
          <h2 class="font-heading font-bold text-lg text-white mb-2">3. Data Security & Storage</h2>
          <p>All data is encrypted in transit (TLS 1.3) and at rest (AES-256). We do not sell your personal data or share it with third-party advertising networks.</p>
        </section>

        <section>
          <h2 class="font-heading font-bold text-lg text-white mb-2">4. Right to Erasure (GDPR)</h2>
          <p>You can request complete deletion of your account and all associated tournament records at any time. When your account is deleted, all participant records, matches, and notifications are purged immediately.</p>
        </section>

        <section>
          <h2 class="font-heading font-bold text-lg text-white mb-2">5. Contact</h2>
          <p>If you have any questions regarding privacy or data protection, please contact us at <a href="mailto:privacy@efootball-arena.com" class="text-neon-green hover:underline">privacy@efootball-arena.com</a>.</p>
        </section>
      </div>

      <div class="mt-8 pt-6 border-t border-glass-border">
        <NuxtLink to="/" class="text-xs text-neon-green hover:underline">← Back to Arena</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Privacy Policy — eFootball Arena' })
</script>
