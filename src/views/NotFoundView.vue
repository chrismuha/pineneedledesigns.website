<template>
  <div class="notfound-page">
    <header>
      <div class="page-header-design" id="rectangle1"></div>
      <div id="rectangle2">
        <img
          loading="lazy"
          decoding="async"
          :src="logoSrc"
          alt="Muha Computer Repair Logo Light"
          class="center logo"
        />
      </div>
    </header>

    <section class="content-wrapper">
      <div class="text-center header2-h2">
        <h2><b>404 PAGE NOT FOUND</b></h2>
      </div>

      <div class="header1-p text-center">
        <p><b>Why am I seeing this message?</b></p>
        <p>
          You are trying to navigate to an inavlid URL. Please verify that the link
          you entered is correct and try again.
        </p>
      </div>
    </section>

    <footer>
      <div id="rectangle3"></div>
      <div id="rectangle4"></div>
    </footer>
  </div>
</template>

<script setup>
const logoSrc = '/404images/MCRwhiteNred.png'
</script>

<style src="../../404.css"></style>
