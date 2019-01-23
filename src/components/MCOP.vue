<template>
  <div style="padding-top: 20px;">
    <!-- tab栏 -->
    <Tabs type="card" @on-click="changeType">
      <TabPane name="all" label="All Station"></TabPane>
      <TabPane name="Assy" label="Assy"></TabPane>
      <TabPane name="TE" label="TE"></TabPane>
      <TabPane name="Button Up" label="Button Up"></TabPane>
      <TabPane name="FP" label="FP"></TabPane>
    </Tabs>

    <Divider>TBD</Divider>
    <Table :loading="table.loading" class="normal" border size="small" :columns="table.column1" :data="waitForStart"></Table>

    <Divider>Kitting</Divider>
    <div style="padding: 0 0 10px 10px;">
      <Button type="primary" @click="generateUPL" :disabled="selectUPL.length == 0">GENERATE CHECKLIST</Button>
      <span style="margin-left: 10px; font-size: 14px;">已选择 {{ selectUPL.length }} 项</span>
    </div>
    <Table :loading="table.loading" class="normal" @on-selection-change="uplselect" border size="small" :columns="table.column2" :data="alreadyStart"></Table>

    <Divider>To Be Assigned</Divider>
    <div style="padding: 0 0 10px 10px;">
      <Button type="success" @click="multiAssign" :disabled="selectAssign.length <= 1">MULTIPLE ASSIGN</Button>
      <span style="margin-left: 10px; font-size: 14px;">已选择 {{ selectAssign.length }} 项，还剩余 <a @click="rackModal = true" style="font-weight: 700; font-size: 16px;">{{
          rack.data.filter(i => !i.KittingId).length }}</a> 个库位</span>
    </div>
    <Table :loading="table.loading" class="normal" @on-selection-change="multiselect" border size="small" :columns="table.column3" :data="toBeAssigned"></Table>

    <Divider>To Be Confirmed</Divider>
    <Table :loading="table.loading" class="normal" border size="small" :columns="table.column4" :data="toBeConfirmed"></Table>

    <Divider>Completed</Divider>
    <Table :loading="table.loading" class="normal" border size="small" :columns="table.column5" :data="alreadyFinish"></Table>

    <!-- view框 -->
    <Modal v-model="viewModal" width="945" title="PickList Info">
      <div style="text-align: center; font-size: 18px; font-weight: 700; margin-bottom: 10px;">Teradyne Operation Pick
        List</div>
      <Table class="picktab" border :columns="viewList.column" :data="viewList.data"></Table>
    </Modal>

    <!-- MC分配确认框 -->
    <Modal v-model="mcCheckModal" width="945" @on-ok="finishCheck" title="PickList Info">
      <div style="text-align: center; font-size: 18px; font-weight: 700; margin-bottom: 10px;">Teradyne Operation Pick
        List</div>
      <Table class="picktab" border :columns="mcCheckList.column" :data="mcCheckList.data"></Table>
    </Modal>

    <!-- Rack框 -->
    <Modal v-model="rackModal" width="945" title="Rack Info">
      <div style="padding: 0 0 10px;">
        Rack Name:
        <Input v-model="newRackName" placeholder="Enter Rack Name" style="width: 120px; margin-right: 10px;" />
        <Button type="success" @click="addRack">ADD RACK</Button>
      </div>
      <Table class="normal" border :columns="rack.column" :data="rack.data"></Table>
    </Modal>

    <!-- Multiple Assign 框 -->
    <Modal v-model="multiModal" width="945" title="Material Assign">
      <div class="pnwrapper" style="text-align: center;">
        <Input ref="pninput" v-model="scanedPN" placeholder="PLEASE SCAN PN" @keyup.enter.native="findPN" style="width: 80%; height: 100px;" />
      </div>
      <p style="font-size: 16px; font-weight: 700">{{ pastPN }}</p>
      <Table class="normal" border :columns="multiTable.column" :data="multiTable.data"></Table>
    </Modal>

    <!-- 工号登录框 -->
    <Modal width="400" v-model="nameModal" title="Login" @on-ok="login">
      <Input v-model="userName" placeholder="Enter your emp#" />
    </Modal>

    <!-- Remark输入框 -->
    <Modal width="400" v-model="remarkModal" title="Remark" @on-ok="inputRemark">
      <Input v-model="remark" placeholder="Enter Remark" />
    </Modal>
  </div>
</template>

<script>
  import {
    config,
    helper
  } from '../config/app.js';
  export default {
    name: 'MCOP',
    data() {
      return {
        tool: helper, // 引入的helper对象
        remark: '', // 填写的remark
        remarkModal: false, // remark框的显示
        scanedPN: '', // 扫描的PN
        pastPN: '', // 扫描之后展示在下面的PN
        newRackName: '', // 新建Rack的名字
        checkId: '', // mc check的数据ID
        viewModal: false, // view表格的显示
        mcCheckModal: false, // mc check的显示
        nameModal: false, // 登录框
        userName: '', // 输入的用户名
        rackModal: false, // rack的显示
        multiModal: false, // 查找多个分配的显示
        selectAssign: [], // 多选的分配项
        selectUPL: [], // 多选的UPL项
        typeName: 'all', // 查询的type名
        loading: true, // 加载picklist时候的loading效果
        goeasy: null, // goeasy对象

        rack: { // Rack增删的表
          data: [],
          column: [{
              type: 'index',
              width: 60,
              align: 'center'
            },
            {
              title: 'RackName',
              align: 'center',
              // width: 100,
              key: 'RackName'
            },
            {
              title: 'Slot',
              // width: 80,
              align: 'center',
              key: 'Slot'
            },
            {
              title: 'PO',
              // width: 80,
              align: 'center',
              key: 'PO'
            },
            {
              title: 'Station',
              // width: 80,
              align: 'center',
              key: 'Station'
            },
            {
              title: 'Assigned Time',
              // width: 80,
              align: 'center',
              key: 'AssignDate',
              render: (h, params) => {
                return h('div', params.row.AssignDate ? helper.getFormatDate(params.row.AssignDate.replace('T', ' ')) : '')
              }
            },
            {
              title: 'Action',
              width: 100,
              align: 'center',
              render: (h, params) => {
                return h('div', [
                  h('Button', {
                    props: {
                      type: 'error',
                      size: 'small'
                    },
                    style: {
                      marginRight: '5px'
                    },
                    on: {
                      click: () => {
                        this.deleteRack(params.row.Id)
                      }
                    }
                  }, 'DELETE')
                ])
              }
            }
          ]
        },

        multiTable: { // 多选分配的表
          data: [],
          column: [{
              title: 'RackName',
              align: 'center',
              key: 'RackName'
            },
            {
              title: 'PO',
              align: 'center',
              key: 'PO'
            },
            {
              title: 'QTY',
              align: 'center',
              key: 'QTY'
            }
          ]
        },

        table: { // 主页的所有表格数据
          data: [],
          column1: [{
              type: 'index',
              width: 60,
              align: 'center'
            },
            {
              title: 'Slot',
              align: 'center',
              width: 100,
              key: 'Slot'
            },
            {
              title: 'PD',
              width: 80,
              align: 'center',
              key: 'ShipDate'
            },
            {
              title: 'PO',
              align: 'center',
              width: 90,
              key: 'PO'
            },
            {
              title: 'Station',
              align: 'center',
              width: 100,
              key: 'Station'
            },
            {
              title: 'Demand Date',
              align: 'center',
              width: 180,
              render: (h, params) => {
                return h('div', helper.getFormatDate(params.row.DemandDate.replace('T', ' ')))
              }
            },
            {
              title: 'Remark',
              align: 'center',
              render: (h, params) => {
                return h('div', {
                  style: {
                    textAlign: 'left'
                  }
                }, params.row.Remark)
              }
            },
            {
              title: 'Action',
              width: 160,
              align: 'center',
              render: (h, params) => {
                return h('div', [
                  h('Button', {
                    props: {
                      type: 'primary',
                      size: 'small'
                    },
                    style: {
                      marginRight: '5px'
                    },
                    on: {
                      click: () => {
                        this.beginAndView(params.row)
                      }
                    }
                  }, 'START'),
                  h('Button', {
                    props: {
                      type: 'warning',
                      size: 'small'
                    },
                    style: {
                      marginRight: '5px'
                    },
                    on: {
                      click: () => {
                        this.showView(params.row)
                      }
                    }
                  }, 'VIEW')
                ])
              }
            }
          ],
          column2: [{
              type: 'selection',
              width: 60,
              align: 'center'
            },
            {
              title: 'Slot',
              align: 'center',
              width: 100,
              key: 'Slot'
            },
            {
              title: 'PD',
              width: 80,
              align: 'center',
              key: 'ShipDate'
            },
            {
              title: 'PO',
              align: 'center',
              width: 90,
              key: 'PO'
            },
            {
              title: 'Station',
              align: 'center',
              width: 100,
              key: 'Station'
            },
            {
              title: 'Demand Date',
              align: 'center',
              width: 180,
              render: (h, params) => {
                return h('div', helper.getFormatDate(params.row.DemandDate.replace('T', ' ')))
              }
            },
            {
              title: 'Remark',
              align: 'center',
              render: (h, params) => {
                return h('div', {
                  style: {
                    textAlign: 'left'
                  }
                }, params.row.Remark)
              }
            },
            {
              title: 'Action',
              width: 160,
              align: 'center',
              render: (h, params) => {
                return h('div', [
                  h('Button', {
                    props: {
                      type: 'primary',
                      size: 'small'
                    },
                    style: {
                      marginRight: '5px'
                    },
                    on: {
                      click: () => {
                        this.assignMaterial(params.row)
                      }
                    }
                  }, 'ASSIGN'),
                  h('Button', {
                    props: {
                      type: 'warning',
                      size: 'small'
                    },
                    style: {
                      marginRight: '5px'
                    },
                    on: {
                      click: () => {
                        this.showView(params.row)
                      }
                    }
                  }, 'VIEW')
                ])
              }
            }
          ],
          column3: [{
              type: 'selection',
              width: 60,
              align: 'center'
            },
            {
              title: 'Slot',
              align: 'center',
              width: 100,
              key: 'Slot'
            },
            {
              title: 'PD',
              width: 80,
              align: 'center',
              key: 'ShipDate'
            },
            {
              title: 'PO',
              align: 'center',
              width: 90,
              key: 'PO'
            },
            {
              title: 'Station',
              align: 'center',
              width: 100,
              key: 'Station'
            },
            {
              title: 'Demand Date',
              align: 'center',
              width: 180,
              render: (h, params) => {
                return h('div', helper.getFormatDate(params.row.DemandDate.replace('T', ' ')))
              }
            },
            {
              title: 'RackName',
              align: 'center',
              width: 120,
              key: 'RackName'
            },
            {
              title: 'Remark',
              align: 'center',
              render: (h, params) => {
                return h('div', {
                  style: {
                    textAlign: 'left'
                  }
                }, params.row.Remark)
              }
            },
            {
              title: 'Action',
              width: 160,
              align: 'center',
              render: (h, params) => {
                return h('div', [
                  h('Button', {
                    props: {
                      type: 'primary',
                      size: 'small'
                    },
                    on: {
                      click: () => {
                        this.nameModal = true
                        this.checkId = params.row.Id // check的时候记录下该数据的Id
                        this.mcCheckList.data = JSON.parse(params.row.PickList)
                      }
                    },
                    style: {
                      marginRight: '5px'
                    }
                  }, 'CHECK'),
                  h('Button', {
                    props: {
                      type: 'warning',
                      size: 'small'
                    },
                    style: {
                      marginRight: '5px'
                    },
                    on: {
                      click: () => {
                        this.showView(params.row)
                      }
                    }
                  }, 'VIEW')
                ])
              }
            }
          ],
          column4: [{
              title: 'Slot',
              align: 'center',
              width: 100,
              key: 'Slot'
            },
            {
              title: 'PD',
              width: 80,
              align: 'center',
              key: 'ShipDate'
            },
            {
              title: 'PO',
              align: 'center',
              width: 90,
              key: 'PO'
            },
            {
              title: 'Station',
              align: 'center',
              width: 100,
              key: 'Station'
            },
            {
              title: 'RackName',
              align: 'center',
              width: 120,
              key: 'RackName'
            },
            {
              title: 'Demand Date',
              align: 'center',
              width: 180,
              render: (h, params) => {
                return h('div', helper.getFormatDate(params.row.DemandDate.replace('T', ' ')))
              }
            },
            {
              title: 'Remark',
              align: 'center',
              render: (h, params) => {
                return h('div', {
                  style: {
                    textAlign: 'left'
                  }
                }, params.row.Remark)
              }
            },
            {
              title: 'Action',
              width: 100,
              align: 'center',
              render: (h, params) => {
                return h('div', [
                  h('Button', {
                    props: {
                      type: 'warning',
                      size: 'small'
                    },
                    style: {
                      marginRight: '5px'
                    },
                    on: {
                      click: () => {
                        this.showView(params.row)
                      }
                    }
                  }, 'VIEW')
                ])
              }
            }
          ],
          column5: [{
              title: 'Slot',
              align: 'center',
              width: 100,
              key: 'Slot'
            },
            {
              title: 'PD',
              width: 80,
              align: 'center',
              key: 'ShipDate'
            },
            {
              title: 'PO',
              align: 'center',
              width: 90,
              key: 'PO'
            },
            {
              title: 'Station',
              align: 'center',
              width: 100,
              key: 'Station'
            },
            {
              title: 'Demand Date',
              align: 'center',
              width: 180,
              render: (h, params) => {
                return h('div', helper.getFormatDate(params.row.DemandDate.replace('T', ' ')))
              }
            },
            {
              title: 'Ensure Date',
              align: 'center',
              width: 180,
              render: (h, params) => {
                return h('div', helper.getFormatDate(params.row.EnsureDate.replace('T', ' ')))
              }
            },
            {
              title: 'Remark',
              align: 'center',
              render: (h, params) => {
                return h('div', {
                  style: {
                    textAlign: 'left'
                  }
                }, params.row.Remark)
              }
            },
            {
              title: 'Action',
              width: 100,
              align: 'center',
              render: (h, params) => {
                return h('div', [
                  h('Button', {
                    props: {
                      type: 'warning',
                      size: 'small'
                    },
                    style: {
                      marginRight: '5px'
                    },
                    on: {
                      click: () => {
                        this.showView(params.row)
                      }
                    }
                  }, 'VIEW')
                ])
              }
            }
          ]
        },

        viewList: { // 预览的表格对象
          data: [],
          column: [{
              title: 'Line',
              align: 'center',
              width: 30,
              key: 'Line'
            },
            {
              title: 'Item Number',
              width: 100,
              align: 'center',
              key: 'Item Number'
            },
            {
              title: 'Component',
              width: 100,
              align: 'center',
              key: 'Component'
            },
            {
              title: 'G',
              width: 30,
              align: 'center',
              key: 'Group'
            },
            {
              title: 'Comp Desc',
              width: 80,
              align: 'center',
              tooltip: true,
              key: 'Comp Description'
            },
            {
              title: 'Location',
              width: 70,
              align: 'center',
              tooltip: true,
              key: 'Location'
            },
            {
              title: 'Category',
              align: 'center',
              tooltip: true,
              key: 'Category'
            },
            {
              title: 'E Qty',
              width: 40,
              align: 'center',
              key: 'Extended Qty'
            },
            {
              title: 'MC Check',
              width: 100,
              align: 'center',
              key: 'MC Check'
            },
            {
              title: 'Checker',
              width: 100,
              align: 'center',
              key: 'Checker'
            },
            {
              title: 'Packing Check',
              width: 100,
              align: 'center',
              key: 'Packing Check'
            },
            {
              title: 'Remark',
              width: 50,
              tooltip: true,
              align: 'center',
              render: (h, params) => {
                return h('div', {
                  style: {
                    width: '50px',
                    height: '20px'
                  },
                  on: {
                    'click': () => {
                      this.remark = params.row.Remark
                    }
                  }
                }, params.row.Remark)
              }
            }
          ],
        },

        mcCheckList: { // MC check的表格对象
          column: [{
              title: 'Line',
              align: 'center',
              width: 30,
              key: 'Line'
            },
            {
              title: 'Item Number',
              width: 100,
              align: 'center',
              key: 'Item Number'
            },
            {
              title: 'Component',
              width: 100,
              align: 'center',
              key: 'Component'
            },
            {
              title: 'G',
              width: 30,
              align: 'center',
              key: 'Group'
            },
            {
              title: 'Comp Desc',
              width: 80,
              tooltip: true,
              align: 'center',
              key: 'Comp Description'
            },
            {
              title: 'Location',
              width: 70,
              align: 'center',
              tooltip: true,
              key: 'Location'
            },
            {
              title: 'Category',
              align: 'center',
              tooltip: true,
              key: 'Category'
            },
            {
              title: 'E Qty',
              width: 40,
              align: 'center',
              key: 'Extended Qty'
            },
            {
              title: 'MC Check',
              width: 100,
              align: 'center',
              key: 'MC Check',
              render: (h, params) => {
                if (!params.row['MC Check']) {
                  return h('div', [
                    h('Button', {
                      props: {
                        type: 'warning',
                        size: 'small'
                      },
                      on: {
                        click: () => {
                          var o = this.mcCheckList.data.find(i => i.Id == params.row['Id'])
                          o['MC Check'] = localStorage.getItem('kittingUser')
                          this.$http.post(config.baseUrl + 'systeminfo/updatePickList', {
                            id: this.checkId, // check记录的ID
                            str: JSON.stringify(this.mcCheckList.data)
                          }).then(res => {
                            this.mcCheckList.data.splice(0, 0)
                            this.getSystemList(this.typeName)
                          })
                        }
                      }
                    }, 'Confirm')
                  ])
                } else {
                  return h('div', [
                    h('span', params.row['MC Check'])
                  ])
                }
              }
            },
            {
              title: 'Checker',
              width: 100,
              align: 'center',
              key: 'Checker'
            },
            {
              title: 'Packing Check',
              width: 100,
              align: 'center',
              key: 'Packing Check'
            },
            {
              title: 'Remark',
              width: 50,
              tooltip: true,
              align: 'center',
              key: 'Remark'
            }
          ],
          data: []
        }
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
          return (i.StartDate && !i.FinishDate)
        })
      },

      // 待分配的集合
      toBeAssigned() {
        return this.table.data.filter(i => {
          return (i.FinishDate && !i.AssignDate)
        })
      },

      // 待确认的集合
      toBeConfirmed() {
        return this.table.data.filter(i => {
          return (i.AssignDate && !i.EnsureDate)
        })
      },

      // 已结束的集合
      alreadyFinish() {
        return this.table.data.filter(i => {
          return i.EnsureDate
        }).reverse().slice(0, 10)
      }
    },

    created() {
      this.$Message.config({
        top: window.innerHeight / 2 - 50,
        duration: 3
      });
      this.getSystemList('all')
      this.getRackList()
      this.initWebInfo()
    },

    methods: {
      // 获取对应type的Kitting信息
      getSystemList(type, fn) {
        this.table.loading = true
        this.$http.get(config.baseUrl + 'systeminfo/getTypedSystem?type=' + type).then(res => {
          if (res.body.Data) {
            this.table.data = res.body.Data
          } else {
            this.table.data = []
          }
          this.table.loading = false
          if (fn) {
            fn(res.body.Data)
          }
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
            this.getRackList()
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
            this.getSystemList('all')
            this.getRackList()
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
            this.getSystemList('all')
            this.getRackList()
            this.$Notice.open({
              title: '新的备料备料通知',
              desc: message.content,
              duration: 5
            });
          }
        });

        // 注册确认备料通知的channel
        this.goeasy.subscribe({
          channel: 'te2mc-ensure',
          onMessage: message => {
            this.getSystemList('all')
            this.getRackList()
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
            this.getSystemList('all')
            this.getRackList()
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
            this.getSystemList('all')
            this.getRackList()
            this.$Notice.open({
              title: '备料完成通知',
              desc: message.content,
              duration: 5
            });
          }
        });
      },

      // 点击tab栏 加载对应的数据列表
      changeType(name) {
        this.typeName = name;
        this.selectAssign = []
        this.selectUPL = []
        this.getSystemList(this.typeName)
      },

      // 获取racklist的方法
      getRackList(fn) {
        this.$http.get(config.baseUrl + 'rack/getRack').then(res => {
          if (res.body.Code == 200) {
            this.rack.data = res.body.Data
          }
          if (fn) {
            fn(res.body.Data)
          }
        })
      },

      // 添加rack
      addRack() {
        if (this.newRackName) {
          this.$http.post(config.baseUrl + 'rack/addRack', {
            RackName: this.newRackName
          }).then(res => {
            if (res.body.Code == 200) {
              this.newRackName = ''
              this.getRackList()
              this.$Message.success({
                content: '添加成功',
                duration: 2
              })
            }
          })
        }
      },

      // 删除rack
      deleteRack(id) {
        this.$http.get(config.baseUrl + 'rack/deleteRack?id=' + id).then(res => {
          if (res.body.Code == 200) {
            this.getRackList()
            this.$Message.success({
              content: '删除成功',
              duration: 2
            })
          }
        })
      },

      // 获取pickList的方法
      getPickList(item, fn) {
        this.$Spin.show({
          render: (h) => {
            return h('div', [
              h('Icon', {
                'class': 'demo-spin-icon-load',
                props: {
                  type: 'ios-loading',
                  size: 30
                }
              }),
              h('div', {
                style: {
                  fontSize: '16px'
                }
              }, [
                h('p', 'Loading PickList...'),
                h('p', '第一次加载可能较慢...')
              ])
            ])
          }
        });
        this.$http.get(config.baseUrl + 'systeminfo/getPickList?po=' + item.PO).then(res => {
          this.$Spin.hide();
          var sta = ''
          res.body.Data.forEach((i, index) => {
            i['Promise Date'] = i['Promise Date'].toString().substr(0, 10)
            i['Id'] = index
            sta = item.Station == 'FP' ? 'MC' : item.Station // 11/22改的BUG 只出现FP
          })
          res.body.Data = res.body.Data.filter(i => {
            return (i.Category.toUpperCase().indexOf(sta.toUpperCase()) == 0 || // 2019.1.3 这里改成=0，是为了匹配以站别名开头
                    i.Category.toUpperCase() == '' ||
                    i.Category.toUpperCase().indexOf('MIX') > -1)
          })

          res.body.Data = res.body.Data.filter(i => i.Location).concat(res.body.Data.filter(i => !i.Location))
          if (fn) {
            fn(res.body.Data)
          }
        })
      },

      // 点击view查看详情的方法
      showView(item) {
        if (item.PickList) {
          this.viewModal = true
          this.viewList.data = JSON.parse(item.PickList)
        } else {
          this.getPickList(item, (picklist) => {
            this.$http.post(config.baseUrl + 'systeminfo/updatePickList', {
              id: item.Id,
              str: JSON.stringify(picklist)
            }).then(res => {
              if (res.body.Code == 200) {
                this.getSystemList(this.typeName, (systemInfo) => {
                  this.viewModal = true
                  this.viewList.data = JSON.parse(systemInfo.find(i => i.Id == item.Id).PickList)
                })
              }
            })
          })
        }
      },

      // 点击begin时的方法
      beginAndView(item) {
        if (item.PickList) {
          this.viewModal = true
          this.viewList.data = JSON.parse(item.PickList)
          this.beginTask(item)
        } else {
          this.getPickList(item, (picklist) => {
            this.$http.post(config.baseUrl + 'systeminfo/updatePickList', {
              id: item.Id,
              str: JSON.stringify(picklist)
            }).then(res => {
              if (res.body.Code == 200) {
                this.getSystemList(this.typeName, (systemInfo) => {
                  this.viewModal = true
                  this.viewList.data = JSON.parse(systemInfo.find(i => i.Id == item.Id).PickList)
                  this.beginTask(item)
                })
              }
            })
          })
        }
      },

      // 点击assign时的事件
      assignMaterial(item) {
        this.getRackList((racklist) => {
          var flag = true
          racklist.forEach(i => {
            if (!i.KittingId) {
              flag = false
              this.$http.get(config.baseUrl + `rack/inrack?rackId=${i.Id}&kittingId=${item.Id}&rackName=${i.RackName}`).then(res => {
                if (res.body.Code == 200) {
                  this.$Message.success({
                    content: '分配成功！分配到 ' + i.RackName + ' 上',
                    duration: 2
                  })
                  // this.goeasy.publish({
                  //   channel: 'mc2te-finish',
                  //   message: '请注意，' + item.SystemSlot + ' ' + config.station.find(i => i.item == item.Station).chinese + '备料已经就绪，请及时到' + i.RackName + '取料！' + ' Attention please! ' + item.SystemSlot + ' ' + config.station.find(i => i.item == item.Station).english + ' material is ready! '
                  // });
                  this.getSystemList(this.typeName)
                  this.getRackList();
                }
              })
            }
          })
          if (flag) {
            this.$Message.error({
              content: 'Rack已满！',
              duration: 2
            })
          }
        })
      },

      // 表格的选中事件
      multiselect(selection) {
        this.selectAssign = selection
      },

      // 批量分配
      multiAssign() {
        this.multiTable.data = this.selectAssign
        this.multiModal = true
      },

      // 扫码查找PN
      findPN() {
        this.selectAssign.forEach(i => {
          var obj = JSON.parse(i.PickList)
          i.QTY = 0
          obj.forEach(it => {
            if (it.Component == this.scanedPN) {
              i.QTY = i.QTY + +it['Extended Qty']
            }
          })
        })
        this.pastPN = this.scanedPN;
        this.scanedPN = ''
        this.multiTable.data = this.selectAssign
        this.multiTable.data.splice(0, 0)
      },

      // 开始备料通知
      beginTask(item) {
        this.$http.get(config.baseUrl + 'systeminfo/beginTask?id=' + item.Id).then(res => {
          if (res.body.Code == 200) {
            this.getSystemList(this.typeName)
            this.goeasy.publish({
              channel: 'mc2te-begin',
              message: item.SystemSlot + config.station.find(i => i.item == item.Station).chinese + '备料开始! ' + item.SystemSlot + ' ' + config.station.find(i => i.item == item.Station).english + ' material is on kitting!'
            });
            this.$Message.success({
              content: '开始成功！',
              duration: 2
            })
          }
        })
      },

      // 登录
      login() {
        if (!this.userName.trim()) {
          this.$Message.error('请输入正确的工号');
        } else {
          this.$http.get(config.baseUrl + 'user/getUserName?emp=' + this.userName).then(res => {
            if (res.body.Data.length > 0) {
              localStorage.setItem('kittingUser', res.body.Data[0]['Name'])
              this.mcCheckModal = true
              this.$Message.success('登录成功')
            } else {
              this.$Message.error('工号不存在');
            }
          })
        }
        this.userName = ''
      },

      //  MC 结束分配
      finishCheck() {
        if (this.mcCheckList.data.find(i => i['MC Check'] == null) || this.mcCheckList.data.find(i => i['MC Check'] == '')) {
          this.getSystemList(this.typeName)
          this.$Message.error({
            content: '分配未完成，请检查！',
            duration: 2
          })
        } else {
          this.$http.get(config.baseUrl + 'systeminfo/finishSingleAssign?id=' + this.checkId).then(res => {
          if (res.body.Code == 200) {
            this.getSystemList(this.typeName)
            this.$Message.success({
              content: '分配完成！',
              duration: 2
            })
          }
        })
        }
      },

      // 表格的选中事件
      uplselect(selection) {
        this.selectUPL = selection
      },

      // 生成UPL
      generateUPL() {
        var list = []
        this.selectUPL.forEach(i => {
          var obj = JSON.parse(i.PickList)
          obj.forEach(it => {
            var temp = list.find(item => item['Item Number'] == it['Item Number'] && item['Component'] == it['Component'])
            if (temp) {
              temp['Extended Qty'] = +temp['Extended Qty'] + +it['Extended Qty']
            } else {
              list.push(it)
            }
          })
        })
        this.viewList.data = list.filter(i => !i.Location)
        this.viewList.data.splice(0, 0)
        this.viewModal = true
      },

      // 编辑Remark
      // TODO: 编辑Remark 要定位到该记录的ID的picklist, 明天做！
      inputRemark() {

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

  /deep/ .picktab .ivu-table-cell {
    padding: 3px 0;
  }

  /deep/ .picktab .ivu-table-small td {
    height: unset;
  }

  /deep/ .picktab .ivu-table {
    font-size: 12px;
  }

  /deep/ .picktab .ivu-table td,
  .ivu-table th {
    height: unset;
  }

  /deep/ .normal .ivu-table-cell {
    padding-left: 18px;
    padding-right: 18px;
  }

  /deep/ .normal .ivu-table-small td {
    height: unset;
  }

  /deep/ .normal .ivu-table {
    font-size: 14px;
  }

  /deep/ .normal .ivu-table td,
  .ivu-table th {
    height: 48px;
  }

  /deep/ .ivu-table-cell {
    padding: 3px 0;
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

  /* /deep/ .ivu-divider-horizontal.ivu-divider-with-text-center {
    margin-bottom: 0;
  } */

  /deep/ .ivu-divider-inner-text {
    font-size: 18px;
    color: #f00;
  }

  /deep/ .pnwrapper .ivu-input {
    height: 60px;
    font-size: 40px;
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

  /deep/ .ivu-divider-horizontal.ivu-divider-with-text-center:after, .ivu-divider-horizontal.ivu-divider-with-text-center:before, .ivu-divider-horizontal.ivu-divider-with-text-left:after, .ivu-divider-horizontal.ivu-divider-with-text-left:before, .ivu-divider-horizontal.ivu-divider-with-text-right:after, .ivu-divider-horizontal.ivu-divider-with-text-right:before {
    border-top: 1px dashed #007dc1;
  }

</style>