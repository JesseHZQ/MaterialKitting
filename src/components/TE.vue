<template>
  <div>
    <!-- 语音标签 -->
    <div>
      <div id="bdtts_div_id">
        <audio id="tts_autio_id" autoplay="autoplay">
          <source id="tts_source_id" src="" type="audio/mpeg">
          <embed id="tts_embed_id" height="0" width="0" src="">
        </audio>
      </div>
    </div>

    <!-- 加载中 -->
    <Spin fix v-if="spinShow">
      <Icon type="logo-apple" size=32 class="demo-spin-icon-load"/>
      <!-- <Icon type="ios-loading" size=32 class="demo-spin-icon-load"></Icon> -->
      <div><span style="font-size: 18px;">Loading...</span></div>
    </Spin>

    <!-- background: linear-gradient(#73f36e , #3ca248); 绿色 -->
    <!-- background: linear-gradient(#6cd1ff , #0fa5e8); 蓝色 -->
    <!-- background: linear-gradient(#ffb916 , #ff8d27); 黄色 -->
    <div v-for="(it, index) in AllList" :key="index">
      <Divider>{{ it.item }}</Divider>
      <div style="overflow: scroll;" class="hidebar">
        <div :style="{ width: it.width }" style="padding-top: 10px;">
          <Card class="ready" style="backgroundColor: #1f8300; color: #fff; position: relative;" v-for="item in it.data.filter(i => i.AssignDate && !i.EnsureDate)" :key="item.Id">
            <p slot="title" style="color: #fff;">{{ item.SystemSlot || item.Slot }}</p>
            <span slot="extra">Ready</span>
            <div style="background: #fff; color: #222;">
              <table style="text-align: left;">
                <tr style="height: 30px;">
                  <td>PO#：</td>
                  <td>{{ item.PO }}</td>
                </tr>
                <tr style="height: 30px;">
                  <td>Expect：</td>
                  <td>{{ item.DemandDate ? tool.getFormatDate(item.DemandDate) : 'No Data' }}</td>
                </tr>
                <tr style="height: 30px;">
                  <td>Rack Loc#：</td>
                  <td>{{ item.RackName }}</td>
                </tr>
              </table>
            </div>
          </Card>
          <Card class="kitting" style="backgroundColor: #0254b9; color: #fff; position: relative;" v-for="item in it.data.filter(i => i.StartDate && !i.AssignDate)" :key="item.Id">
            <p slot="title" style="color: #fff;">{{ item.SystemSlot || item.Slot }}</p>
            <span slot="extra">Kitting</span>
            <div style="background: #fff; color: #222;">
              <table style="text-align: left;">
                <tr style="height: 30px;">
                  <td>PO#：</td>
                  <td>{{ item.PO }}</td>
                </tr>
                <tr style="height: 30px;">
                  <td>Expect：</td>
                  <td>{{ item.DemandDate ? tool.getFormatDate(item.DemandDate) : 'No Data' }}</td>
                </tr>
              </table>
              <Tooltip placement="top" :content="'Duration: ' + item.longDate" style="width: 100%; z-index=999">
                <Progress :percent="parseFloat((item.djs / it.duration).toFixed(2)) > 100 ? 101 : parseFloat((item.djs / it.duration).toFixed(2))" :status="parseFloat((item.djs / it.duration).toFixed(2)) > 100 ? 'wrong' : 'active'" />
              </Tooltip>
            </div>
          </Card>
          <Card class="notstart" style="backgroundColor: rgb(255, 153, 0); color: #fff; position: relative;" v-for="(item, index) in it.data.filter(i => !i.StartDate)" :key="item.Id">
            <img v-if="index == 0" class="rank" src="../assets/imgs/top1.png" alt="">
            <img v-if="index == 1" class="rank" src="../assets/imgs/top2.png" alt="">
            <img v-if="index == 2" class="rank" src="../assets/imgs/top3.png" alt="">
            <p slot="title" style="color: #fff;">{{ item.SystemSlot || item.Slot }}</p>
            <span slot="extra" class="">Not Start</span>
            <div style="background: #fff; color: #222;">
              <table style="text-align: left;">
                <tr style="height: 30px;">
                  <td>PO#：</td>
                  <td>{{ item.PO }}</td>
                </tr>
                <tr style="height: 30px;">
                  <td>Expect：</td>
                  <td>{{ item.DemandDate ? tool.getFormatDate(item.DemandDate) : 'No Data' }}</td>
                </tr>
                <tr style="height: 30px;">
                  <td>Duration：</td>
                  <td>{{ item.longDate }}</td>
                </tr>
              </table>
            </div>
          </Card>
        </div>
      </div>
      <img src="../assets/imgs/NoData.jpg" class="nodata" v-show="it.data.filter(i => !i.EnsureDate).length == 0" alt="">
    </div>
  </div>
</template>

<script>
  import {
    config,
    helper
  } from '../config/app.js';
  export default {
    name: 'TE',
    data() {
      return {
        tool: helper,
        spinShow: false,
        timer: null, // 定时器Id 倒计时作用
        table: { // 主页的所有卡片数据
          data: []
        },
        goeasy: null // goeasy对象
      }
    },

    computed: {
      AllList() {
        return [
          {
            item: 'Option Integration',
            data: this.table.data.filter(i => i.Station == 'Assy'),
            width: this.table.data.filter(i => i.Station == 'Assy' && !i.EnsureDate).length * 320 + 'px',
            duration: 288000
          },
          {
            item: 'System Testing',
            data: this.table.data.filter(i => i.Station == 'TE'),
            width: this.table.data.filter(i => i.Station == 'TE' && !i.EnsureDate).length * 320 + 'px',
            duration: 216000
          },
          {
            item: 'Button Up',
            data: this.table.data.filter(i => i.Station == 'Button Up'),
            width: this.table.data.filter(i => i.Station == 'Button Up' && !i.EnsureDate).length * 320 + 'px',
            duration: 144000
          },
          {
            item: 'Final Process',
            data: this.table.data.filter(i => i.Station == 'FP'),
            width: this.table.data.filter(i => i.Station == 'FP' && !i.EnsureDate).length * 320 + 'px',
            duration: 288000
          },
        ]
      }
    },

    created() {
      this.getSystemList()
      this.initWebInfo()
      this.getBaiduToken()
    },

    methods: {
      // 获取百度云的token
      getBaiduToken() {
        // this.$http.get(config.baseUrl + 'systeminfo/getBaiduToken').then(res => {
          // this.baiduToken = JSON.parse(res.body)['access_token']
          this.baiduToken = '24.2a10754a181f3e37edb6ad14999f8178.2592000.1550794709.282335-14547213' // 2018-11-15 the server cannot connect to network, we need to get token manually
        // })
      },

      // 语音方法
      doTTS(text) {
        var ttsDiv = document.getElementById('bdtts_div_id');
        var ttsAudio = document.getElementById('tts_autio_id');
        // 这样就可实现播放内容的替换了
        ttsDiv.removeChild(ttsAudio);
        var au1 = '<audio id="tts_autio_id" autoplay="autoplay">';
        var sss = `<source id="tts_source_id" src="http://tsn.baidu.com/text2audio?tex=${text}&lan=zh&per=0&cuid=888&ctp=1&tok=${this.baiduToken}" type="audio/mpeg">`;
        var eee = '<embed id="tts_embed_id" height="0" width="0" src="">';
        var au2 = '</audio>';
        ttsDiv.innerHTML = au1 + sss + eee + au2;
        ttsAudio = document.getElementById('tts_autio_id');
        ttsAudio.play();
      },

      // 实现计时功能
      getLongDate(list) {
        clearInterval(this.timer)
        list.forEach(i => {
          if (!i.StartDate) {
            i.longDate = '--'
          } else {
            if (i.AssignDate) {
              i.longDate = helper.getTimeDiff(new Date(i.StartDate), new Date(i.AssignDate))
            } else {
              i.djs = this.$moment.utc() - this.$moment.utc(this.$moment(i.StartDate))
              i.longDate = helper.getTimeDiff(this.$moment.utc(this.$moment(i.StartDate)), this.$moment.utc())
            }
          }
        })
        this.table.data = list;
        this.table.data.splice(0, 0)
        this.timer = setInterval(_ => {
          list.forEach(i => {
            if (!i.StartDate) {
              i.longDate = '--'
            } else {
              if (i.AssignDate) {
                i.longDate = helper.getTimeDiff(new Date(i.StartDate), new Date(i.AssignDate))
              } else {
                i.djs = this.$moment.utc() - this.$moment.utc(this.$moment(i.StartDate))
                i.longDate = helper.getTimeDiff(this.$moment.utc(this.$moment(i.StartDate)), this.$moment.utc())
              }
            }
          })
          this.table.data = list;
          this.table.data.splice(0, 0)
        }, 1000)
      },

      // 获取对应type的系统信息
      getSystemList() {
        this.spinShow = true
        this.$http.get(config.baseUrl + 'systeminfo/getTypedSystem?type=all').then(res => {
          this.table.data = res.body.Data || []
          this.getLongDate(this.table.data)
          setTimeout(_ => {
            this.spinShow = false
          }, 500)
        })
      },

      // 初始化websocket
      initWebInfo() {
        this.goeasy = new GoEasy({
          appkey: 'BC-49ce6073260241339c70c7e597cee303'
        });

        // 注册接受备料通知的channel
        this.goeasy.subscribe({
          channel: 'te2mc-inform',
          onMessage: message => {
            this.getSystemList()
            this.doTTS(message.content + message.content)
            this.$Notice.open({
              title: '新的备料通知',
              desc: message.content,
              duration: 5
            });
          }
        });

        // 注册撤销备料通知的channel
        this.goeasy.subscribe({
          channel: 'te2mc-revoke',
          onMessage: message => {
            this.getSystemList()
            this.doTTS(message.content + message.content)
            this.$Notice.open({
              title: '新的撤销备料通知',
              desc: message.content,
              duration: 5
            });
          }
        });

        // 注册备料变更通知的channel
        this.goeasy.subscribe({
          channel: 'te2mc-update',
          onMessage: message => {
            this.getSystemList()
            this.doTTS(message.content + message.content)
            this.$Notice.open({
              title: '新的备料备料通知',
              desc: message.content,
              duration: 5
            });
          }
        });

        // 注册接受备料通知的channel
        this.goeasy.subscribe({
          channel: 'te2mc-ensure',
          onMessage: message => {
            this.getSystemList()
            this.doTTS(message.content + message.content)
            this.$Notice.open({
              title: '新的确认收料通知',
              desc: message.content,
              duration: 5
            });
          }
        });

        // 接收MC通知TE--备料开始
        this.goeasy.subscribe({
          channel: 'mc2te-begin',
          onMessage: message => {
            this.getSystemList()
            this.doTTS(message.content)
            this.$Notice.open({
              title: '开始备料通知',
              desc: message.content,
              duration: 5
            });
          }
        });

        // 接收MC通知TE--备料结束
        this.goeasy.subscribe({
          channel: 'mc2te-finish',
          onMessage: message => {
            this.getSystemList()
            this.doTTS(message.content + message.content)
            this.$Notice.open({
              title: '备料完成通知',
              desc: message.content,
              duration: 5
            });
          }
        });
      }
    }
  }

</script>

<style scoped>
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

  .header p {
    line-height: 80px;
    text-align: center;
  }

  span.label {
    padding: 4px 8px;
    /* background-color: #2d8cf0; */
    border: 1px solid #fff;
    border-radius: 4px;
    color: #fff;
  }

  .nodata {
    width: 250px; 
    display: block;
    margin: 0 auto;
  }

  .rank {
    position: absolute;
    left: -10px;
    top: -20px;
    width: 40px;
  }

  .hidebar::-webkit-scrollbar {
    display: none;
  }

  /deep/ .ivu-card {
    float: left;
    /* position: absolute; */
    height: 185.4px;
    width: 300px;
    margin: 10px;
    font-size: 16px;
    min-width: 300px;
  }

  /deep/ .ivu-tabs-bar {
    margin-bottom: 0;
  }

  /deep/ .demo-spin-icon-load{
    animation: ani-demo-spin 1s linear infinite;
  }

  /deep/ .ivu-table-cell {
    padding-left: 0;
    padding-right: 0;
  }

  /deep/ .ivu-table-small td {
    height: unset;
  }

  /deep/ .ivu-table {
    font-size: 10px;
  }

  /deep/ .ivu-table td, .ivu-table th {
    height: unset;
  }

  /deep/ .ivu-card-head p {
    font-size: 18px;
  }

  /deep/ .ivu-progress-show-info .ivu-progress-outer {
    padding-right: 80px;
    margin-right: -80px;
  }

  /deep/ .ivu-progress-text {
    font-size: 16px;
  }

  /deep/ .ivu-progress-bg {
    height: 12px !important;
  }

  /deep/ .ivu-card-body {
    background-color: #fff;
    margin-top: -1px;
    height: 133px;
    font-weight: 700;
    /* margin: 0 1px; */
  }

  /deep/ .ready .ivu-card-body {
    border-left: 1px solid #1f8300;
    border-right: 1px solid #1f8300;
    border-bottom: 1px solid #1f8300;
  }

  /deep/ .kitting .ivu-card-body {
    border-left: 1px solid #0254b9;
    border-right: 1px solid #0254b9;
    border-bottom: 1px solid #0254b9;
  }

  /deep/ .notstart .ivu-card-body {
    border-left: 1px solid rgb(255, 153, 0);
    border-right: 1px solid rgb(255, 153, 0);
    border-bottom: 1px solid rgb(255, 153, 0);
  }

  /deep/ .ivu-divider-inner-text {
    font-size: 24px;
    font-weight: 700;
    padding: 10px 0;
    background-color: #007dc1;
    border-radius: 10px;
    color: #fff;
    width: 240px;
  }

  /deep/ .ivu-divider-horizontal.ivu-divider-with-text-center:after, 
  .ivu-divider-horizontal.ivu-divider-with-text-center:before, 
  .ivu-divider-horizontal.ivu-divider-with-text-left:after, 
  .ivu-divider-horizontal.ivu-divider-with-text-left:before, 
  .ivu-divider-horizontal.ivu-divider-with-text-right:after, 
  .ivu-divider-horizontal.ivu-divider-with-text-right:before {
    border-top: 1px dashed #007dc1;
  }

</style>