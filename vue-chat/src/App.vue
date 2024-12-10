<script >
import Pusher from 'pusher-js'
export default {
  data() {
    return {
      username: 'xonyis',
      messages: [],
      message:''
    }
  },
  mounted(){
    Pusher.logToConsole = true;

    const pusher = new Pusher('8e7b6e5a3111b1da7c12', {
      cluster: 'eu'
    });

    const channel = pusher.subscribe('chat');
    channel.bind('message', data => {
      this.messages.push(data);
    });
  },
  methods: {
    async submit() {
      await fetch('http://localhost:8000/api/messages', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          username: this.username,
          message : this.message
        })
      })

      this.message = ''
    }
  }
}
</script>

<template>
  <div class="container">
    <div class="d-flex flex-column align-items-stretch flex-shrink-0 bg-body-tertiary" >
    <div href="/" class="d-flex align-items-center flex-shrink-0 p-3 link-body-emphasis text-decoration-none border-bottom">
      <input type="text" class="fs-5 fw-semibold" v-model="username">
    </div>
    <div class="list-group list-group-flush border-bottom scrollarea">
      
      <div href="#" class="list-group-item list-group-item-action py-3 lh-sm" v-for="message in messages" :key="message">
        <div class="d-flex w-100 align-items-center justify-content-between">
          <strong class="mb-1">{{message.username}}</strong>
          <small class="text-body-secondary">Tues</small>
        </div>
        <div class="col-10 mb-1 small">{{message.message}}</div>
      </div>

    </div>
  </div>
  <form action="" @submit.prevent="submit" >
    <input v-model="message" type="text" class="form-control" placeholder=" Write a message"/>
    <button type="submit">submit</button>
  </form>
  </div>
</template>

<style>
.scrollarea {
  min-height: 500px;
}
</style>