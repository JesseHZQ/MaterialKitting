<template>
  <div style="padding-top: 20px;">
    <!-- tab栏 -->
    <Tabs type="card" @on-click="getTypedList">
      <TabPane name="all" label="All Station"></TabPane>
      <TabPane name="Assy" label="Assy"></TabPane>
      <TabPane name="TE" label="TE"></TabPane>
      <TabPane name="Button Up" label="Button Up"></TabPane>
      <TabPane name="FP" label="FP"></TabPane>
      <TabPane name="Packing" label="Packing"></TabPane>
    </Tabs>

    <!-- 抽屉 -->
    <Drawer width="400" :closable="false" v-model="infoModal">
      <div slot="header" style="font-size: 16px; font-weight: 700; line-height: 20px; height: 20px;">
        <Icon type="ios-alert" size="20" color="blue" />
        <span>{{ this.currentInfo.Slot }}</span>
      </div>
      <table style="font-size: 14px;">
        <tr>
          <td>Slot：</td>
          <td style="text-align: left;">{{ this.currentInfo.Slot }}</td>
        </tr>
        <tr>
          <td>ShipDate：</td>
          <td style="text-align: left;">{{ this.currentInfo.ShipDate }}</td>
        </tr>
        <tr>
          <td>Type：</td>
          <td style="text-align: left;">{{ this.currentInfo.SystemModel }}</td>
        </tr>
        <tr>
          <td>Customer：</td>
          <td style="text-align: left;">{{ this.currentInfo.Customer }}</td>
        </tr>
        <tr>
          <td>PO：</td>
          <td style="text-align: left;">{{ this.currentInfo.PO }}</td>
        </tr>
        <tr>
          <td>SO：</td>
          <td style="text-align: left;">{{ this.currentInfo.SO }}</td>
        </tr>
        <tr>
          <td>InformDate：</td>
          <td style="text-align: left;">{{ this.currentInfo.InformDate ?
            this.currentInfo.InformDate.toString().replace('T', ' ') : 'N/A' }}</td>
        </tr>
        <tr>
          <td>DemandDate：</td>
          <td style="text-align: left;">{{ this.currentInfo.DemandDate ?
            this.currentInfo.DemandDate.toString().replace('T', ' ') : 'N/A' }}</td>
        </tr>
        <tr>
          <td>StartDate：</td>
          <td style="text-align: left;">{{ this.currentInfo.StartDate ?
            this.currentInfo.StartDate.toString().replace('T', ' ') : 'N/A' }}</td>
        </tr>
        <tr>
          <td>FinishDate：</td>
          <td style="text-align: left;">{{ this.currentInfo.FinishDate ?
            this.currentInfo.FinishDate.toString().replace('T', ' ') : 'N/A' }}</td>
        </tr>
        <tr>
          <td>EnsureDate：</td>
          <td style="text-align: left;">{{ this.currentInfo.EnsureDate ?
            this.currentInfo.EnsureDate.toString().replace('T', ' ') : 'N/A' }}</td>
        </tr>
      </table>
    </Drawer>

    <!-- 语音标签 -->
    <div>
      <div id="bdtts_div_id">
        <audio id="tts_autio_id" autoplay="autoplay">
          <source id="tts_source_id" src="" type="audio/mpeg">
          <embed id="tts_embed_id" height="0" width="0" src="">
        </audio>
      </div>
    </div>

    <!-- 未开始的项目 -->
    <Divider>TBD</Divider>
    <Card style="background: linear-gradient(#ffb916 , #ff8d27); color: #fff; position: relative;" v-for="(item, index) in waitForStart"
      :key="item.Id">
      <img v-if="index == 0" class="rank" src="../assets/imgs/top1.png" alt="">
      <img v-if="index == 1" class="rank" src="../assets/imgs/top2.png" alt="">
      <img v-if="index == 2" class="rank" src="../assets/imgs/top3.png" alt="">
      <p slot="title" style="color: #fff;">
        {{ item.SystemSlot }}
      </p>
      <span slot="extra" class="label">
        {{ item.Station }}
      </span>
      <div>
        <table style="text-align: right;">
          <tr>
            <td>PO Number：</td>
            <td style="text-align: left;">{{ item.PO }}</td>
          </tr>
          <tr>
            <td>Demand Time：</td>
            <td style="text-align: left;">{{ item.DemandDate ? tool.getFormatDate(item.DemandDate) : 'No data' }}</td>
          </tr>
          <tr>
            <td>Action：</td>
            <td style="text-align: left;">
              <Button type="success" v-if="!item.StartDate" size="small" @click="getPickList(item)">START</Button>
              <Button type="error" v-else-if="!item.FinishDate" size="small" @click="finishTask(item.Id)">FINISH</Button>
              <Button disabled v-else-if="!item.EnsureDate" size="small" @click="finishTask(item.Id)">READY</Button>
              <Button type="warning" style="background: #ffb916" size="small" @click="getDetail(item.Id)">DETAIL</Button>
            </td>
          </tr>
        </table>
      </div>
    </Card>
    <img src="../assets/imgs/NoData.jpg" class="nodata" v-show="waitForStart.length == 0" alt="">

    <!-- 进行中的项目 -->
    <Divider>On-Going</Divider>
    <Card style="background: linear-gradient(#6cd1ff , #0fa5e8); color: #fff;" v-for="item in alreadyStart" :key="item.Id">
      <p slot="title" style="color: #fff;">
        {{ item.SystemSlot }}
      </p>
      <span slot="extra" class="label">
        {{ item.Station }}
      </span>
      <div>
        <table style="text-align: right;">
          <tr>
            <td>PO Number：</td>
            <td style="text-align: left;">{{ item.PO }}</td>
          </tr>
          <tr>
            <td>Demand Time：</td>
            <td style="text-align: left;">{{ item.DemandDate ? tool.getFormatDate(item.DemandDate) : 'No data' }}</td>
          </tr>
          <tr>
            <td>Action：</td>
            <td style="text-align: left;">
              <Button type="success" v-if="!item.StartDate" size="small" @click="getPickList(item)">START</Button>
              <Button type="error" v-else-if="!item.FinishDate" size="small" @click="finishTask(item.Id)">FINISH</Button>
              <Button disabled v-else-if="!item.EnsureDate" size="small" @click="finishTask(item.Id)">READY</Button>
              <Button type="warning" style="background: #ffb916" size="small" @click="getDetail(item.Id)">DETAIL</Button>
            </td>
          </tr>
        </table>
      </div>
    </Card>
    <img src="../assets/imgs/NoData.jpg" class="nodata" v-show="alreadyStart.length == 0" alt="">

    <!-- 已完成的项目 -->
    <Divider>Completed</Divider>
    <Card style="background: linear-gradient(#73f36e , #3ca248); color: #fff;" v-for="item in alreadyFinish" :key="item.Id">
      <p slot="title" style="color: #fff;">
        {{ item.SystemSlot }}
      </p>
      <span slot="extra" class="label">
        {{ item.Station }}
      </span>
      <div>
        <table style="text-align: right;">
          <tr>
            <td>PO Number：</td>
            <td style="text-align: left;">{{ item.PO }}</td>
          </tr>
          <tr>
            <td>Demand Time：</td>
            <td style="text-align: left;">{{ item.DemandDate ? tool.getFormatDate(item.DemandDate) : 'No data' }}</td>
          </tr>
          <tr>
            <td>Action：</td>
            <td style="text-align: left;">
              <Button type="success" v-if="!item.StartDate" size="small" @click="getPickList(item)">START</Button>
              <Button type="error" v-else-if="!item.FinishDate" size="small" @click="finishTask(item.Id)">FINISH</Button>
              <Button disabled v-else-if="!item.EnsureDate" size="small" @click="finishTask(item.Id)">READY</Button>
              <Button type="warning" style="background: #ffb916" size="small" @click="getDetail(item.Id)">DETAIL</Button>
            </td>
          </tr>
        </table>
      </div>
    </Card>
    <img src="../assets/imgs/NoData.jpg" class="nodata" v-show="alreadyFinish.length == 0" alt="">

    <Modal v-model="printModal" @on-ok="printpage" okText="打印" width="1060" title="PickList Info">
      <div id="myPrint">
        <div style="text-align: center; font-size: 18px; font-weight: 700; margin-bottom: 10px;">Teradyne Operation
          Pick List</div>
        <p style="font-size: 10px;">PO: {{ pickList.data.length > 0 ? pickList.data[0].PONum : '' }}</p>
        <p style="font-size: 10px;">
          Supplier Note: FCT PO for Sales Order {{ pickList.data.length > 0 ? pickList.data[0].SONum : '' }}
        </p>
        <p style="font-size: 10px; height: 15px;">
          <span style="float: left; width: 50%;">Customer: {{ pickList.data.length > 0 ? pickList.data[0].CustomerName
            : '' }}</span>
          <span style="float: right; width: 50%;">Picklist Name: {{ currentInfo.Slot + ' ' + currentInfo.Station }}</span>
        </p>
        <p style="font-size: 10px; height: 15px;">
          <span style="float: left; width: 50%;">System Order: {{ currentInfo.Slot }}</span>
          <span style="float: right; width: 50%;">Printed Time: {{ $moment().format('DD/MM/YYYY HH:mm:ss') }}</span>
        </p>
        <Table border :columns="pickList.column" :data="pickList.data"></Table>
        <p>Total: {{ pickList.data.length }}</p>
        <p style="text-align: right; padding-right: 200px; margin-top: 40px; font-size: 14px;">MC Sign: __________</p>
        <p style="text-align: right; padding-right: 200px; margin-top: 20px; font-size: 14px;">Check Sign: __________</p>
      </div>
    </Modal>
  </div>
</template>

<script>
  import {
    config,
    helper
  } from '../config/app.js';
  export default {
    name: 'MC',
    data() {
      return {
        baiduToken: null,
        tool: helper,
        currentInfo: {},
        infoModal: false, // 抽屉信息框展示
        printModal: false, // 打印信息框展示
        timer: null, // 定时器Id
        typeName: 'all', // 查询的type名
        table: { // 主页的所有卡片数据
          data: []
        },
        pickList: { // 打印预览的表格对象
          data: [],
          column: [{
              title: 'Line',
              align: 'center',
              width: 30,
              key: 'Line'
            },
            {
              title: 'Item Number',
              width: 80,
              align: 'center',
              key: 'Item Number'
            },
            {
              title: 'Assy Desc',
              align: 'center',
              width: 90,
              ellipsis: true,
              key: 'Assy Description'
            },
            {
              title: 'Qty',
              width: 30,
              align: 'center',
              key: 'Qty'
            },
            {
              title: 'Component',
              width: 80,
              align: 'center',
              key: 'Component'
            },
            {
              title: 'G',
              width: 20,
              align: 'center',
              key: 'Group'
            },
            {
              title: 'Comp Desc',
              width: 90,
              align: 'center',
              ellipsis: true,
              key: 'Comp Description'
            },
            {
              title: 'Promise Date',
              width: 70,
              align: 'center',
              key: 'Promise Date'
            },
            {
              title: 'Location',
              width: 50,
              align: 'center',
              key: 'Location'
            },
            {
              title: 'Category',
              align: 'center',
              key: 'Category'
            },
            {
              title: 'E Qty',
              width: 40,
              align: 'center',
              key: 'Extended Qty'
            },
            {
              title: 'Ori-Box Qty',
              width: 60,
              align: 'center',
              key: 'OriginalBoxQty'
            },
            {
              title: 'MC Check',
              width: 60,
              align: 'center',
              key: 'MC Check'
            },
            {
              title: 'Checker',
              width: 50,
              align: 'center',
              key: 'Checker'
            },
            {
              title: 'S Code?',
              width: 50,
              align: 'center',
              key: 'S Code'
            },
            {
              title: 'Packing Check',
              width: 80,
              align: 'center',
              key: 'Packing Check'
            },
            {
              title: 'Remark',
              width: 40,
              align: 'center',
              key: 'Remark'
            }
          ],
        },
        loading: true, // 加载picklist时候的loading效果
        goeasy: null // goeasy对象
      }
    },

    computed: {
      // 未开始的集合
      waitForStart() {
        return this.table.data.filter(i => {
          return !i.StartDate
        })
      },

      // 进行中的集合
      alreadyStart() {
        return this.table.data.filter(i => {
          return (i.StartDate && !i.EnsureDate)
        })
      },

      // 已结束的集合
      alreadyFinish() {
        return this.table.data.filter(i => {
          return i.EnsureDate
        })
      }
    },

    created() {
      this.getSystemList('all')
      this.initWebInfo()
      this.getBaiduToken()
    },

    methods: {
      // 获取百度云的token
      getBaiduToken() {
        // this.$http.get(config.baseUrl + 'systeminfo/getBaiduToken').then(res => {
          // this.baiduToken = JSON.parse(res.body)['access_token']
          this.baiduToken = '24.375b3cd57ca398596e11ef1d0dbc848b.2592000.1543125749.282335-14547213'
        // })
      },
      // 打印的方法
      printpage() {
        var newstr = document.getElementById('myPrint').innerHTML;
        var oldstr = document.body.innerHTML;
        document.body.innerHTML = newstr;
        window.print();
        document.body.innerHTML = oldstr;
        window.location.reload()
        return false;
      },

      // 语言方法
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

      // 获取Picklist的方法
      getPickList(item) {
        this.currentInfo = item
        this.$Spin.show({
          render: (h) => {
            return h('div', [
              h('Icon', {
                'class': 'demo-spin-icon-load',
                props: {
                  type: 'ios-loading',
                  size: 18
                }
              }),
              h('div', 'loading picklist...')
            ])
          }
        });
        this.$http.get(config.baseUrl + 'systeminfo/getPickList?po=' + item.PO).then(res => {
          this.$Spin.hide();
          this.printModal = true
          res.body.Data = res.body.Data.filter(i => {
            return (i.Category.toUpperCase().indexOf(item.Station.toUpperCase()) > -1 ||
              i.Category.toUpperCase() == '' ||
              i.Category.toUpperCase().indexOf('MIX') > -1)
          })
          res.body.Data.forEach(i => {
            i['Promise Date'] = i['Promise Date'].toString().substr(0, 10)
          })
          this.pickList.data = res.body.Data
          this.beginTask(item.Id)
        })
      },

      // 查询抽屉信息
      getDetail(id) {
        this.currentInfo = this.table.data.find(i => i.Id == id)
        this.infoModal = true;
      },

      // 开始备料通知
      beginTask(id) {
        this.$http.get(config.baseUrl + 'systeminfo/beginTask?id=' + id).then(res => {
          if (res.body.Code == 200) {
            this.getSystemList(this.typeName)
            this.goeasy.publish({
              channel: 'mc2te-begin',
              message: '有新的系统已经开始备料！'
            });
            this.$Message.success({
              content: '开始成功！',
              duration: 2
            })
          }
        })
      },

      // 完成备料通知
      finishTask(id) {
        this.$http.get(config.baseUrl + 'systeminfo/finishTask?id=' + id).then(res => {
          if (res.body.Code == 200) {
            this.getSystemList(this.typeName)
            this.goeasy.publish({
              channel: 'mc2te-finish',
              message: '有新的系统已经完成备料！'
            });
            this.$Message.success({
              content: '结束成功！',
              duration: 2
            })
          }
        })
      },

      // 实现计时功能
      getLongDate(list) {
        var that = this;
        clearInterval(this.timer)
        list.forEach(i => {
          if (!i.StartDate) {
            i.longDate = '暂无'
          } else {
            if (i.FinishDate) {
              i.longDate = new Date(i.FinishDate) - new Date(i.StartDate)
              var h = parseInt(i.longDate / 1000 / 60 / 60)
              var m = parseInt(i.longDate / 1000 / 60 % 60)
              var s = parseInt(i.longDate / 1000 % 60)
              h = h.toString().length > 1 ? h.toString() : ('0' + h.toString())
              m = m.toString().length > 1 ? m.toString() : ('0' + m.toString())
              s = s.toString().length > 1 ? s.toString() : ('0' + s.toString())
              i.longDate = h + ':' + m + ':' + s
            } else {
              i.longDate = new Date() - new Date(i.StartDate)
              var h = parseInt(i.longDate / 1000 / 60 / 60)
              var m = parseInt(i.longDate / 1000 / 60 % 60)
              var s = parseInt(i.longDate / 1000 % 60)
              h = h.toString().length > 1 ? h.toString() : ('0' + h.toString())
              m = m.toString().length > 1 ? m.toString() : ('0' + m.toString())
              s = s.toString().length > 1 ? s.toString() : ('0' + s.toString())
              i.longDate = h + ':' + m + ':' + s
            }
          }
        })
        that.table.data = list;
        this.table.data.splice(0, 0)
        this.timer = setInterval(_ => {
          list.forEach(i => {
            if (!i.StartDate) {
              i.longDate = '暂无'
            } else {
              if (i.FinishDate) {
                i.longDate = new Date(i.FinishDate) - new Date(i.StartDate)
                var h = parseInt(i.longDate / 1000 / 60 / 60)
                var m = parseInt(i.longDate / 1000 / 60 % 60)
                var s = parseInt(i.longDate / 1000 % 60)
                h = h.toString().length > 1 ? h.toString() : ('0' + h.toString())
                m = m.toString().length > 1 ? m.toString() : ('0' + m.toString())
                s = s.toString().length > 1 ? s.toString() : ('0' + s.toString())
                i.longDate = h + ':' + m + ':' + s
              } else {
                i.longDate = new Date() - new Date(i.StartDate)
                var h = parseInt(i.longDate / 1000 / 60 / 60)
                var m = parseInt(i.longDate / 1000 / 60 % 60)
                var s = parseInt(i.longDate / 1000 % 60)
                h = h.toString().length > 1 ? h.toString() : ('0' + h.toString())
                m = m.toString().length > 1 ? m.toString() : ('0' + m.toString())
                s = s.toString().length > 1 ? s.toString() : ('0' + s.toString())
                i.longDate = h + ':' + m + ':' + s
              }
            }
          })
          that.table.data = list;
          this.table.data.splice(0, 0)
        }, 1000)
      },

      // 点击tab栏 加载对应的数据列表
      getTypedList(name) {
        this.typeName = name;
        this.getSystemList(this.typeName)
      },

      // 获取对应type的系统信息
      getSystemList(type) {
        this.table.loading = true
        this.$http.get(config.baseUrl + 'systeminfo/getTypedSystem?type=' + type).then(res => {
          if (res.body.Data) {
            this.table.data = res.body.Data
          } else {
            this.table.data = []
          }
          this.getLongDate(this.table.data)
          this.table.loading = false
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
            this.getSystemList('all')
            this.doTTS('Ladys and gentleman, ' + message.content)
            this.$Notice.open({
              title: '新的备料通知',
              desc: message.content,
              duration: 0
            });
          }
        });

        // 注册撤销备料通知的channel
        this.goeasy.subscribe({
          channel: 'te2mc-revoke',
          onMessage: message => {
            this.getSystemList('all')
            this.doTTS(message.content)
            this.$Notice.open({
              title: '新的撤销备料通知',
              desc: message.content,
              duration: 0
            });
          }
        });

        // 注册接受备料通知的channel
        this.goeasy.subscribe({
          channel: 'te2mc-ensure',
          onMessage: message => {
            this.getSystemList('all')
            this.doTTS(message.content)
            this.$Notice.open({
              title: '新的确认收料通知',
              desc: message.content,
              duration: 0
            });
          }
        });

        // 接收MC通知TE--备料开始
        this.goeasy.subscribe({
          channel: 'mc2te-begin',
          onMessage: message => {
            this.getSystemList('all')
            this.doTTS(message.content)
            this.$Notice.open({
              title: '开始备料通知',
              desc: message.content,
              duration: 0
            });
          }
        });

        // 接收MC通知TE--备料结束
        this.goeasy.subscribe({
          channel: 'mc2te-finish',
          onMessage: message => {
            this.getSystemList('all')
            this.doTTS(message.content)
            this.$Notice.open({
              title: '备料完成通知',
              desc: message.content,
              duration: 0
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

  /deep/ .ivu-card {
    float: left;
    width: 24%;
    margin: 10px .5%;
    min-width: 300px;
  }

  /deep/ .ivu-tabs-bar {
    margin-bottom: 0;
  }

  /deep/ .demo-spin-icon-load {
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

  /deep/ .ivu-table td,
  .ivu-table th {
    height: unset;
  }

</style>
