module.exports = {
  apps : [{
    name : 'NUMBER-BOT',
    script: 'src/bot.js',
    watch: '.',
    instances : "max",
    exec_mode : "cluster"
  }, {
    script: './service-worker/',
    watch: ['./service-worker']
  }]
};
