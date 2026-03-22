<template>
  <v-app>
    <v-app-bar elevation="2" color="primary">
      <template #prepend>
        <v-icon icon="mdi-calendar-month" class="ml-3" />
      </template>
      <v-app-bar-title class="font-weight-bold">Toskana Planer</v-app-bar-title>
    </v-app-bar>

    <v-main>
      <NuxtPage />
    </v-main>
  </v-app>
</template>
<style>
.v-application {
  font-family: "Nunito", sans-serif;
}
</style>
