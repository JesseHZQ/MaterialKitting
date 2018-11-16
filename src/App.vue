<template>
  <div id="app" class="hidebar">
    <div class="header">
      <p>
        <span>BU7 Material Kitting KanBan System</span>
        <span style="float: right; margin-right: 20px; font-size: 12px;">
          <a @click="$router.push('/')">KANBAN</a>
          <a @click="$router.push('/te')">TE PLATFORM</a>
          <a @click="$router.push('/mcop')">MC PLATFORM</a>
        </span>
      </p>
    </div>
    <router-view class="content"/>
  </div>
</template>

<script>
  export default {
    name: 'App',
    // created() {
    //   if (navigator.userAgent.toUpperCase().indexOf("CHROME") == -1) {
    //     alert('为了更好的体验，请使用chrome访问')
    //   }
    // }
  }

</script>

<style>
  .header {
    height: 80px;
    background-color: #282B35;
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: 100%;
    min-width: 1024px;
    z-index: 99;
  }

  .header span a {
    padding: 0 5px;
    color: #fff;
    border-right: 1px solid #fff;
  }

  .header span a:hover {
    color: #57a3f3;
  }

  .header p {
    height: 80px;
    line-height: 80px;
    text-align: center;
    box-sizing: border-box;
  }

  .header p span:nth-of-type(1) {
    font-size: 30px;
    margin-right: 20px;
    color: #fff;
    font-weight: 700;
  }

  .header p span:nth-of-type(2) {
    margin-top: 10px;
  }

  .aside {
    position: fixed;
    left: 0;
    top: 80px;
    height: 100%;
    z-index: 99;
  }

  #app {
    padding: 80px 0 0;
  }

</style>
