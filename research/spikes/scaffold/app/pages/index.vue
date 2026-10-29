<script setup lang="ts">
const name = ref('')
const birth = ref('')
const salary = ref(12345)
</script>

<template>
  <UContainer class="py-8 max-w-xl">
    <h1 class="text-2xl font-bold mb-6">טופס 101 — סקיצת בדיקה</h1>
    <UForm :state="{ name, birth, salary }" class="space-y-4">
      <UFormField label="שם פרטי" name="name" required>
        <UInput v-model="name" placeholder="ישראל" class="w-full" />
      </UFormField>
      <UFormField label="תאריך לידה" name="birth">
        <UInputDate v-model="birth" class="w-full" />
      </UFormField>
      <UFormField label="משכורת חודשית" name="salary">
        <UInputNumber v-model="salary" :format-options="{ style: 'currency', currency: 'ILS' }" class="w-full" />
      </UFormField>
      <UButton type="submit" label="שמור" block />
    </UForm>
    <p class="mt-6 text-sm text-muted">הנתונים נשמרים במכשיר שלך בלבד.</p>
  </UContainer>
</template>
