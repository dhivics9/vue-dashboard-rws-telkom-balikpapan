<script setup>
import { ref, computed } from 'vue';

const counter = ref(0);
</script>

<template>
    <main>
        <button @click="counter++">Increment Counter</button>
        <button @click="counter--">Decrement Counter</button>
        <p>Counter Value: {{ counter }}</p>
    </main>
</template>