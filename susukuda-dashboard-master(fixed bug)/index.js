const axios = require('axios');
const path = require('path');
const { performance } = require('perf_hooks');

const store = require('data-store')({
  path: path.resolve(__dirname, 'data', 'raw.json')
});

if (process.argv[2]) {
  async function retrieveIoT2TangleData(channel) {
    try {
      var timerStart = performance.now();
      console.log('Channel: ', channel);
      var data = [];
      // var response = await axios.get('http://localhost:8585/decode_channel/ddfa2e8ec3554f0616e05c52bde98aab980e6dc702e2c5fd166c9214c16da7260000000000000000:30e5c1c2eddf1eb31514241f');
      var response = await axios.get('https://iot2tangle.arkandina.tech/decode_channel/' + channel);
      if (response.data.messages.length > 0) {
        for (var i = 0; i < response.data.messages.length; i++) {
          // console.log(JSON.parse(response.data.messages[i]));
          data.push(JSON.parse(response.data.messages[i]));
        }
        store.set(channel, data);
        store.load();
        console.log('Retrieved Data');
      }
    } catch (err) {
      console.error(err);
    }
  }
  retrieveIoT2TangleData(process.argv[2])
} else {
  console.log('Failed')
}
