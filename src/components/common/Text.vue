
<style lang="scss" scoped>
  p {
    color: red;
    font-weight: bold;
  }
</style>

<template>
  <h2 v-if="this.title">{{ this.title }}</h2>
  <p><slot></slot></p>
</template>

<script>
export default {
  props: ["xablau"],
  data() {
    return {
      title: this.xablau,
    };
  },
};
</script>
