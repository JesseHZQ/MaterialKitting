<template>
  <div>
    <Divider>UF</Divider>
    <Table :loading="table.loading" size="small" border ref="table" :columns="table.column" :data="table.data.filter(i => i.SystemSlot.indexOf('UF') > -1)"></Table>
    <Divider>IF</Divider>
    <Table :loading="table.loading" size="small" border ref="table" :columns="table.column" :data="table.data.filter(i => i.SystemSlot.indexOf('IF') > -1)"></Table>
    <Divider>MF</Divider>
    <Table :loading="table.loading" size="small" border ref="table" :columns="table.column" :data="table.data.filter(i => i.SystemSlot.indexOf('MF') > -1)"></Table>
    <!-- 编辑发送通知Modal -->
    <Modal :title="'Kitting Remind - ' + formValidate.SystemSlot" :loading="remindLoading" width="400" v-model="editShow"
      class-name="vertical-center-modal" @on-ok="submit">
      <Form ref="formValidate" :rules="ruleValidate" :model="formValidate" :label-width="70">
        <FormItem label="PO:">
          <Input v-model="formValidate.PO" disabled style="width:300px" />
        </FormItem>
        <FormItem label="Demand Date:" prop="RequireDate">
          <DatePicker v-model="formValidate.RequireDate" style="width:300px" show-week-numbers type="datetime"
            placeholder="Select Demand Date"></DatePicker>
        </FormItem>
        <FormItem label="Station:" prop="Station">
          <Select v-model="formValidate.Station" disabled style="width:300px">
            <Option value="Assy" key="1">Assy</Option>
            <Option value="TE" key="2">TE</Option>
            <Option value="Button Up" key="3">Button Up</Option>
            <Option value="FP" key="4">FP</Option>
          </Select>
        </FormItem>
        <FormItem label="Requestor ID:" prop="RequestorId">
          <Input v-model="formValidate.RequestorId" style="width:300px" />
        </FormItem>
        <FormItem label="Remark:">
          <Input v-model="formValidate.Remark" type="textarea" :autosize="{ minRows: 2,maxRows: 10 }" placeholder="Input Remark"></Input>
        </FormItem>
      </Form>
    </Modal>

    <!-- 撤销确认Modal -->
    <Modal title="Warning" width="400" v-model="deleteShow" @on-ok="deleteHandler" class-name="vertical-center-modal">
      <p>确定要撤销通知吗？</p>
    </Modal>

    <!-- 确认收料框 -->
    <Modal v-model="viewModal" width="945" ok-text="收料完成" @on-ok="ensureHandler" title="Material Ensurance Info">
      <p>料在Rack："{{ ensureId ? originalData.find(i => i.Id == ensureId).RackName : '' }}" 上，确定备料准确无误吗？</p>
      <div style="text-align: center; font-size: 18px; font-weight: 700; margin-bottom: 10px;">Teradyne Operation Pick
        List</div>
      <Table class="picktab" border :columns="checkList.column" :data="checkList.data"></Table>
    </Modal>

    <!-- 浏览Picklist框 -->
    <Modal v-model="vmodal" width="945" title="Picklist Info">
      <div style="text-align: center; font-size: 18px; font-weight: 700; margin-bottom: 10px;">Teradyne Operation Pick
        List</div>
      <Table class="picktab" border :columns="checkList.column" :data="checkList.data"></Table>
    </Modal>

    <Modal width="400" v-model="nameModal" title="Login" @on-ok="login">
      <Input v-model="userName" placeholder="Enter your emp#" />
    </Modal>
  </div>
</template>

<script>
  import {
    config,
    helper
  } from '../config/app.js';
  export default {
    name: 'Home',
    data() {
      return {
        tableHeight: 0, // 表格高度
        userName: '',
        nameModal: false,
        viewModal: false,
        vmodal: false,
        checkList: { // 预览的表格对象
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
              width: 60,
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
              width: 60,
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
              width: 65,
              align: 'center',
              key: 'Location'
            },
            {
              title: 'Category',
              width: 80,
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
              width: 40,
              align: 'center',
              key: 'OriginalBoxQty'
            },
            {
              title: 'MC Check',
              width: 55,
              align: 'center',
              key: 'MC Check',
              render: (h, params) => {
                if (params.row['MC Check'] == 1) {
                  return h('Icon', {
                    props: {
                      type: 'md-checkmark'
                    }
                  })
                }
              }
            },
            {
              title: 'Checker',
              align: 'center',
              render: (h, params) => {
                if (!params.row['Checker']) {
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
                          var o = this.checkList.data.find(i => i.Component == params.row['Component'] && i[
                            'Item Number'] == params.row['Item Number'])
                          o['Checker'] = localStorage.getItem('kittingUser')
                          var a = this.ensureId
                          this.$http.post(config.baseUrl + 'systeminfo/updatePickList', {
                            id: this.ensureId,
                            str: JSON.stringify(this.checkList.data)
                          }).then(res => {
                            this.checkList.data.splice(0, 0)
                            this.getSystemList()
                          })
                        }
                      }
                    }, '点击确认')
                  ])
                } else {
                  return h('div', [
                    h('span', params.row['Checker'])
                  ])
                }
              }
            },
            {
              title: 'Packing Check',
              width: 40,
              align: 'center',
              key: 'Packing Check'
            },
            {
              title: 'Assign',
              width: 40,
              align: 'center',
              key: 'Remark',
              render: (h, params) => {
                if (params.row['Remark'] == 1) {
                  return h('Icon', {
                    props: {
                      type: 'md-checkmark'
                    }
                  })
                }
              }
            }
          ],
        },

        editShow: false, // 发送通知框的显示状态
        deleteShow: false, // 撤销通知框的显示状态
        ensureShow: false,
        isEdit: false,
        editId: null,
        deleteId: null, // 要撤销的通知Id
        ensureId: null,

        formValidate: {}, // 表单对象
        ruleValidate: { // 表单验证对象
          RequireDate: [{
            required: true,
            type: 'date',
            message: 'The Demand Date cannot be empty',
            trigger: 'change'
          }],
          RequestorId: [{
            required: true,
            message: 'RequestorId cannot be empty',
            trigger: 'change'
          }],
          Station: [{
            required: true,
            message: 'Please choose one station',
            trigger: 'change'
          }]
        },
        table: { // 表格对象
          column: [{
              title: 'Slot',
              align: 'center',
              width: 100,
              key: 'SystemSlot'
            },
            {
              title: 'PD',
              width: 80,
              align: 'center',
              key: 'ShipWeek'
            },
            {
              title: 'Type',
              width: 120,
              align: 'center',
              key: 'SystemModel'
            },
            {
              title: 'Customer',
              align: 'center',
              width: 160,
              key: 'Customer'
            },
            {
              title: 'PO',
              width: 80,
              align: 'center',
              key: 'PO'
            },
            {
              title: 'Assy',
              align: 'center',
              render: (h, params) => {
                return helper.customButton(params, h, 'Assy', this);
              }
            },
            {
              title: 'TE',
              align: 'center',
              render: (h, params) => {
                return helper.customButton(params, h, 'TE', this);
              }
            },
            {
              title: 'Button Up',
              align: 'center',
              render: (h, params) => {
                return helper.customButton(params, h, 'Button Up', this);
              }
            },
            {
              title: 'FP',
              align: 'center',
              render: (h, params) => {
                return helper.customButton(params, h, 'FP', this);
              }
            }
          ],
          data: [],
          loading: false
        },
        originalData: null,
        remindLoading: true, // 发送按钮的loading状态开关
        goeasy: null // 外部websocket对象
      }
    },

    mounted() {
      // 自适应计算表格高度
      // this.tableHeight = window.innerHeight - this.$refs.table.$el.offsetTop - 56
    },

    created() {
      // 配置弹出框的参数
      this.$Message.config({
        top: window.innerHeight / 2 - 50,
        duration: 3
      });
      this.initWebInfo()
      this.getSystemList()
    },

    methods: {
      // 获取系统列表
      getSystemList() {
        this.table.loading = true
        this.$http.get(config.baseUrl + 'systeminfo/getAllSystem').then(res => {
          if (res.body.Data) {
            this.originalData = [...res.body.Data];
            // 处理合并相同Slot的不同站别
            var tempArr = []
            res.body.Data.forEach(i => {
              var sel = tempArr.find(e => e.SystemSlot == i.SystemSlot)
              if (sel) {
                if (i.Station) {
                  sel.mt.push({
                    id: i.Id,
                    station: i.Station,
                    remark: i.Remark1,
                    informDate: i.InformDate,
                    ensureDate: i.EnsureDate,
                    assignDate: i.AssignDate,
                    startDate: i.StartDate,
                    finishDate: i.FinishDate,
                    demandDate: i.DemandDate,
                    pickList: i.PickList
                  })
                }
              } else {
                i.mt = []
                tempArr.push(i)
                if (i.Station) {
                  i.mt.push({
                    id: i.Id,
                    station: i.Station,
                    remark: i.Remark1,
                    informDate: i.InformDate,
                    ensureDate: i.EnsureDate,
                    assignDate: i.AssignDate,
                    startDate: i.StartDate,
                    finishDate: i.FinishDate,
                    demandDate: i.DemandDate,
                    pickList: i.PickList
                  })
                }
              }
            })
            this.table.data = tempArr
          } else {
            this.table.data = []
          }
          this.table.loading = false
        })
      },

      // 初始化websocket通讯
      initWebInfo() {
        this.goeasy = new GoEasy({
          appkey: 'BC-49ce6073260241339c70c7e597cee303'
        });

        // 注册接受备料通知的channel
        this.goeasy.subscribe({
          channel: 'te2mc-inform',
          onMessage: message => {
            this.getSystemList()
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
            this.$Notice.open({
              title: '备料完成通知',
              desc: message.content,
              duration: 5
            });
          }
        });
      },

      // 提交备料信息
      submit() {
        this.$refs['formValidate'].validate((valid) => {
          if (valid) {
            var o = { ...this.formValidate
            }
            o.RequireDate = +new Date(o.RequireDate)
            if (this.isEdit) {
              o.Id = this.editId
              this.$http.post(config.baseUrl + 'systeminfo/updateKitting', o).then(res => {
                this.editShow = false
                this.goeasy.publish({
                  channel: 'te2mc-update',
                  message: '请注意，有新的备料变更，' + this.formValidate.SystemSlot + ' ' + config.station.find(i => i
                      .item == this.formValidate.Station).chinese + '需要备料了！' +
                    'Request change attention please! ' + this.formValidate.SystemSlot + ' ' + config.station
                    .find(i => i.item == this.formValidate.Station).english +
                    ' material kitting is requested!'
                });
                if (res.body.Code == 200) {
                  this.$Message.success({
                    content: '修改成功！',
                    duration: 2
                  })
                } else {
                  this.$Message.error({
                    content: res.body.Message,
                    duration: 2
                  })
                }
                this.getSystemList()
              })
              this.isEdit = false
            } else {
              this.$http.post(config.baseUrl + 'systeminfo/sendBeginEmail', o).then(res => {
                this.editShow = false
                this.goeasy.publish({
                  channel: 'te2mc-inform',
                  message: '请注意，有新的备料需求，' + this.formValidate.SystemSlot + ' ' + config.station.find(i => i
                      .item == this.formValidate.Station).chinese + '需要备料了！' +
                    'New request attention please! ' + this.formValidate.SystemSlot + ' ' + config.station.find(
                      i => i.item == this.formValidate.Station).english + ' material kitting is requested!'
                });
                if (res.body.Code == 200) {
                  this.$Message.success({
                    content: '发送成功！',
                    duration: 2
                  })
                } else {
                  this.$Message.error({
                    content: res.body.Message,
                    duration: 2
                  })
                }
                this.getSystemList()
              })
            }
          }
        })
      },

      // 撤销发送请求
      deleteHandler() {
        this.$http.get(config.baseUrl + 'systeminfo/sendDeleteEmail?id=' + this.deleteId + '&slot=' + this.originalData
          .find(i => i.Id == this.deleteId).SystemSlot + '&station=' + this.originalData.find(i => i.Id == this.deleteId)
          .Station).then(res => {
          this.deleteShow = false
          var systemSlot = this.originalData.find(i => i.Id == this.deleteId).SystemSlot
          var station = this.originalData.find(i => i.Id == this.deleteId).Station
          this.goeasy.publish({
            channel: 'te2mc-revoke',
            message: '请注意，有备料变更，' + systemSlot + '撤销' + config.station.find(i => i.item == station).chinese +
              '备料！' + 'Request change attention please! ' + systemSlot + ' ' + config.station.find(i => i.item ==
                station).english + ' material request was canceled!'
          });
          if (res.body.Code == 200) {
            this.$Message.success({
              content: '撤销成功！',
              duration: 2
            })
          } else {
            this.$Message.error({
              content: res.body.Message,
              duration: 2
            })
          }
          this.getSystemList()
        })
      },

      // 确认收料的方法
      ensureHandler() {
        if (this.checkList.data.every(i => i.Checker)) {
          this.$http.get(config.baseUrl + 'systeminfo/sendEnsureEmail?id=' + this.ensureId + '&slot=' + this.originalData
            .find(i => i.Id == this.ensureId).SystemSlot + '&station=' + this.originalData.find(i => i.Id == this.ensureId)
            .Station).then(res => {
            this.$http.get(config.baseUrl + 'rack/outrack?kittingId=' + this.ensureId).then(res => {
              var systemSlot = this.originalData.find(i => i.Id == this.ensureId).SystemSlot
              var station = this.originalData.find(i => i.Id == this.ensureId).Station
              this.ensureShow = false
              this.goeasy.publish({
                channel: 'te2mc-ensure',
                message: systemSlot + ' ' + config.station.find(i => i.item == station).chinese + '备料已完成！' +
                  systemSlot + ' ' + config.station.find(i => i.item == station).english +
                  ' material kitting completed!'
              });
              if (res.body.Code == 200) {
                this.$Message.success({
                  content: '确认收料成功！',
                  duration: 2
                })
              } else {
                this.$Message.error({
                  content: res.body.Message,
                  duration: 2
                })
                return false;
              }
              this.getSystemList()
            })
          })
        } else {
          this.$Message.error({
            content: '收料不全，请检查',
            duration: 2
          })
        }
      },

      // 登录
      login() {
        if (!this.userName.trim()) {
          this.$Message.error('请输入正确的工号');
        } else {
          this.$http.get(config.baseUrl + 'user/getUserName?emp=' + this.userName).then(res => {
            if (res.body.Data.length > 0) {
              localStorage.setItem('kittingUser', res.body.Data[0]['Name'])
              this.viewModal = true
              this.$Message.success('登录成功')
            } else {
              this.$Message.error('工号不存在');
            }
          })
        }
        this.userName = ''
      }
    }
  }

</script>

<style scoped>
  /deep/ .ivu-tabs-bar {
    margin-bottom: 0;
    border-bottom: none;
  }

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

  /deep/ .picktab .ivu-table-cell {
    padding: 8px 0;
  }

  /deep/ .picktab .ivu-table-small td {
    height: unset;
  }

  /deep/ .picktab .ivu-table {
    font-size: 10px;
  }

  /deep/ .picktab .ivu-table td,
  .ivu-table th {
    height: unset;
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
