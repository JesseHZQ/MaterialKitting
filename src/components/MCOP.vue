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
    <!-- <div style="padding: 0 0 10px 10px;">
      <Button type="success" @click="multiAssign">MULTIPLE CHECK</Button>
      <Button type="primary" @click="multiAssign">GENERATE UPL</Button>
      <span style="margin-left: 10px; font-size: 14px;">已选择 {{ selectAssign.length }} 项</span>
    </div> -->
    <Table :loading="table.loading" class="normal" border size="small" :columns="table.column2" :data="alreadyStart"></Table>

    <Divider>To Be Assigned</Divider>
    <div style="padding: 0 0 10px 10px;">
      <Button type="success" @click="multiAssign">MULTIPLE ASSIGN</Button>
      <span style="margin-left: 10px; font-size: 14px;">已选择 {{ selectAssign.length }} 项，还剩余 <a @click="rackModal = true" style="font-weight: 700; font-size: 16px;">{{
          rack.data.filter(i => !i.KittingId).length }}</a> 个库位</span>
    </div>
    <Table :loading="table.loading" class="normal" @on-selection-change="multiselect" border size="small" :columns="table.column3" :data="toBeAssigned"></Table>

    <Divider>To Be Confirmed</Divider>
    <Table :loading="table.loading" class="normal" border size="small" :columns="table.column4" :data="toBeConfirmed"></Table>

    <Divider>Completed</Divider>
    <Table :loading="table.loading" class="normal" border size="small" :columns="table.column5" :data="alreadyFinish"></Table>

    <!-- 打印框 -->
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

    <!-- view框 -->
    <Modal v-model="viewModal" width="945" title="PickList Info">
      <div style="text-align: center; font-size: 18px; font-weight: 700; margin-bottom: 10px;">Teradyne Operation Pick
        List</div>
      <Table class="picktab" border :columns="viewList.column" :data="viewList.data"></Table>
    </Modal>

    <!-- MC收料框 -->
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
    <Modal v-model="multiModal" width="945" @on-ok="finishAssign" okText="完成" title="Material Assign">
      <div class="pnwrapper" style="text-align: center;">
        <Input ref="pninput" v-model="scanedPN" placeholder="PLEASE SCAN PN" @keyup.enter.native="findPN" style="width: 80%; height: 100px;" />
      </div>
      <p style="font-size: 16px; font-weight: 700">{{ pastPN }}</p>
      <Table class="normal" border :columns="multiTable.column" :data="multiTable.data"></Table>
    </Modal>

    <!-- 分配没完全框 -->
    <Modal v-model="shortageModal" width="600" @on-ok="finishAssign" okText="完成" title="Shortage Info">
      <div v-for="item in this.generatedMultiple" :key="item.item">
        <p style="font-size: 16px; font-weight: 700; margin: 10px 0;">{{ item.item }}</p>
        <Table border :columns="shortage.column" :data="item.data"></Table>
      </div>
    </Modal>

    <!-- 工号登录框 -->
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
    name: 'MCOP',
    data() {
      return {
        tool: helper, // 引入的helper对象
        scanedPN: '', // 扫描的PN
        pastPN: '', // 扫描之后展示在下面的PN
        generatedMultiple: [], // 整合后的批量分配数据
        newRackName: '', // 新建Rack的名字
        currentInfo: {},
        checkId: '',
        viewModal: false,
        mcCheckModal: false,
        nameModal: false,
        userName: '',
        rackModal: false,
        multiModal: false,
        printModal: false,
        shortageModal: false,
        selectAssign: [], // 多选的分配项
        selectCheck: [], // 多选的check项
        typeName: 'all', // 查询的type名
        loading: true, // 加载picklist时候的loading效果
        goeasy: null, // goeasy对象
        flag: true, // 分配库位时的节流阀

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
              // width: 100,
              key: 'RackName'
            },
            {
              title: 'PO',
              align: 'center',
              // width: 100,
              key: 'PO'
            },
            {
              title: 'QTY',
              align: 'center',
              // width: 100,
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
                        this.nameModal = true
                        this.checkId = params.row.Id
                        this.mcCheckList.data = JSON.parse(params.row.PickList)
                      }
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
                if (params.row.RackName) {
                  return h('div', [
                    // h('Button', {
                    //   props: {
                    //     type: 'primary',
                    //     size: 'small'
                    //   },
                    //   style: {
                    //     marginRight: '5px'
                    //   }
                    // }, 'PRINT'),
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
                } else {

                  return h('div', [
                    h('Button', {
                      props: {
                        type: 'success',
                        size: 'small'
                      },
                      on: {
                        click: () => {
                          this.assignMaterial(params.row)
                        }
                      },
                      style: {
                        marginRight: '5px'
                      }
                    }, 'ASSIGN'),
                    // h('Button', {
                    //   props: {
                    //     type: 'primary',
                    //     size: 'small'
                    //   },
                    //   style: {
                    //     marginRight: '5px'
                    //   }
                    // }, 'PRINT'),
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
        pickList: { // 打印的表格对象
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
              ellipsis: true,
              key: 'Comp Description'
            },
            {
              title: 'Location',
              width: 70,
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
              title: 'OB Qty',
              width: 50,
              align: 'center',
              key: 'OriginalBoxQty'
            },
            {
              title: 'MC Check',
              width: 60,
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
                      style: {
                        marginRight: '5px'
                      },
                      on: {
                        click: () => {
                          var o = this.mcCheckList.data.find(i => i.Component == params.row['Component'] && i[
                            'Item Number'] == params.row['Item Number'])
                          o['Checker'] = localStorage.getItem('kittingUser')
                          var a = this.ensureId
                          this.$http.post(config.baseUrl + 'systeminfo/updatePickList', {
                            id: this.ensureId,
                            str: JSON.stringify(this.mcCheckList.data)
                          }).then(res => {
                            this.mcCheckList.data.splice(0, 0)
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
              width: 90,
              align: 'center',
              key: 'Packing Check'
            },
            {
              title: 'Remark',
              width: 50,
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
              ellipsis: true,
              key: 'Comp Description'
            },
            {
              title: 'Location',
              width: 70,
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
              title: 'OB Qty',
              width: 50,
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
              width: 90,
              align: 'center',
              key: 'Packing Check'
            },
            {
              title: 'Remark',
              width: 50,
              align: 'center',
              key: 'Remark'
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
              align: 'center',
              ellipsis: true,
              key: 'Comp Description'
            },
            {
              title: 'Location',
              width: 70,
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
              title: 'OB Qty',
              width: 50,
              align: 'center',
              key: 'OriginalBoxQty'
            },
            {
              title: 'MC Check',
              width: 70,
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
                          console.log(params.row)
                          var o = this.mcCheckList.data.find(i => i.Component == params.row['Component'] && i['Item Number'] == params.row['Item Number'])
                          o['MC Check'] = localStorage.getItem('kittingUser')
                          this.$http.post(config.baseUrl + 'systeminfo/updatePickList', {
                            id: this.checkId,
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
              width: 90,
              align: 'center',
              key: 'Packing Check'
            },
            {
              title: 'Remark',
              width: 50,
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
          data: []
        },
        shortage: {
          column: [
            {
              title: 'PN',
              align: 'center',
              // width: 30,
              key: 'pn'
            },
            {
              title: 'QTY',
              // width: 80,
              align: 'center',
              key: 'qty'
            }
          ]
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
        })
      }
    },

    created() {
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

      // 浏览器打印的方法
      printpage() {
        var newstr = document.getElementById('myPrint').innerHTML;
        var oldstr = document.body.innerHTML;
        document.body.innerHTML = newstr;
        window.print();
        document.body.innerHTML = oldstr;
        window.location.reload()
        return false;
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
          res.body.Data.forEach(i => {
            if (!i.Category) {
              i.Category = ''
            }
            if (item.Station == 'FP') {
              sta = 'MC'
            } else {
              sta = item.Station // 11/22改的BUG 只出现FP
            }
          })
          res.body.Data = res.body.Data.filter(i => {
            return (i.Category.toUpperCase().indexOf(sta.toUpperCase()) == 0 || // 2019.1.3 这里改成=0，是为了匹配以站别名开头
              i.Category.toUpperCase() == '' ||
              i.Category.toUpperCase().indexOf('MIX') > -1)
          })
          res.body.Data.forEach(i => {
            i['Promise Date'] = i['Promise Date'].toString().substr(0, 10)
          })
          // 有Location的排在上面
          var arr1 = res.body.Data.filter(i => {
            return i.Location
          })
          var arr2 = res.body.Data.filter(i => {
            return !i.Location
          })
          res.body.Data = arr1.concat(arr2)
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

      // 点击print的方法
      printPickList(item) {
        this.currentInfo = item;
        if (item.PickList) {
          this.printModal = true
          this.pickList.data = JSON.parse(item.PickList)
        } else {
          this.getPickList(item, (picklist) => {
            this.$http.post(config.baseUrl + 'systeminfo/updatePickList', {
              id: item.Id,
              str: JSON.stringify(picklist)
            }).then(res => {
              if (res.body.Code == 200) {
                this.getSystemList(this.typeName, (systemInfo) => {
                  this.printModal = true
                  this.pickList.data = JSON.parse(systemInfo.find(i => i.Id == item.Id).PickList)
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
        this.flag = true
        this.getRackList((racklist) => {
          racklist.forEach(i => {
            if (this.flag) {
              if (!i.KittingId) {
                this.flag = false
                this.$http.get(config.baseUrl + `rack/inrack?rackId=${i.Id}&kittingId=${item.Id}&rackName=${i.RackName}`).then(res => {
                  if (res.body.Code == 200) {
                    this.getSystemList(this.typeName, (systemInfo) => {
                      var picklist = JSON.parse(systemInfo.find(itemR => itemR.Id == item.Id).PickList)
                      picklist.forEach(item => {
                        item.Remark = 1
                      })
                      this.$http.post(config.baseUrl + 'systeminfo/updatePickList', {
                        id: item.Id,
                        str: JSON.stringify(picklist)
                      }).then(res => {
                        this.$Message.success({
                          content: '分配成功！分配到 ' + i.RackName + ' 上',
                          duration: 2
                        })
                        this.goeasy.publish({
                          channel: 'mc2te-finish',
                          message: '请注意，' + item.SystemSlot + ' ' + config.station.find(i => i.item == item.Station).chinese + '备料已经就绪，请及时到' + i.RackName + '取料！' + ' Attention please! ' + item.SystemSlot + ' ' + config.station.find(i => i.item == item.Station).english + ' material is ready! '
                        });
                        this.getSystemList(this.typeName)
                        this.getRackList();
                      })
                    })
                  }
                })
              }
            }
          })
        })
      },

      // 表格的选中事件
      multiselect(selection) {
        this.selectAssign = selection
      },

      // 批量分配
      multiAssign() {
        // 还原数据
        debugger
        this.scanedPN = ''
        this.multiTable.data = []
        this.multiTable.data.splice(0, 0)
        this.generatedMultiple = []
        this.pastPN = ''
        // 如果多选少于两个，提示错误
        if (this.selectAssign.length < 2) {
          this.$Message.error({
            content: '请至少选择两个PO',
            duration: 2
          })
        } else {
          // 如果多选的每个都有RackName 则开始整合数据并进行扫码分配
          if (this.selectAssign.every(i => i.RackName)) {
            this.multiModal = true
            this.$refs['pninput'].$refs['input'].autofocus = true
            this.multiTable.data = this.selectAssign
            this.multiTable.data.forEach(i => {
              var arr = []
              JSON.parse(i.PickList).forEach(item => {
                if (!item.Remark) {
                  let temp = arr.find(ii => ii.pn == item.Component)
                  if (temp) {
                    temp.qty = +temp.qty + +item['Extended Qty']
                  } else {
                    arr.push({
                      pn: item.Component,
                      qty: +item['Extended Qty']
                    })
                  }
                }
              })
              this.generatedMultiple.push({
                item: i.PO,
                data: arr
              })
            })
          } else {
            // 如果不是每个都有 但是有的话 提示错误
            if (this.selectAssign.find(i => i.RackName)) {
              this.$Message.error({
                content: '所选项已分配库位',
                duration: 2
              })
            } else {
              // 如果选的都没分配，则一个一个进行分配，分配完进入扫码分配
              this.$http.get(config.baseUrl + 'rack/getRack').then(res => {
                if (res.body.Code == 200) {
                  this.rack.data = res.body.Data
                  this.selectAssign.forEach(item => {
                    this.flag = true
                    this.rack.data.forEach(i => {
                      if (this.flag) {
                        if (!i.KittingId) {
                          this.flag = false
                          i.KittingId = item.Id
                          this.multiTable.data.push({
                            rackId: i.Id,
                            kittingId: item.Id,
                            ...item,
                            RackName: i.RackName
                          })
                        }
                      }
                    })
                  })
                  this.$http.post(config.baseUrl + 'rack/multipleinrack', {
                    arr: this.multiTable.data
                  }).then(res => {
                    if (res.body.Code == 200) {
                      this.$Message.success({
                        content: '分配成功！',
                        duration: 2
                      })
                      this.multiModal = true
                      this.$refs['pninput'].$refs['input'].autofocus = true
                      this.multiTable.data.forEach(i => {
                        var arr = []
                        JSON.parse(i.PickList).forEach(item => {
                          let temp = arr.find(ii => ii.pn == item.Component)
                          if (temp) {
                            temp.qty = +temp.qty + +item['Extended Qty']
                          } else {
                            arr.push({
                              pn: item.Component,
                              qty: +item['Extended Qty']
                            })
                          }
                        })
                        this.generatedMultiple.push({
                          item: i.PO,
                          data: arr
                        })
                      })
                      this.selectAssign = []
                      // 更新rack和kitting的信息
                      this.getSystemList(this.typeName)
                      this.getRackList();
                    }
                  })
                }
              })
            }
          }
        }
      },

      // 扫码查找PN
      findPN() {
        this.scanedPN = this.scanedPN[0] == 'P' ? this.scanedPN.slice(1) : this.scanedPN
        var count = 0
        this.multiTable.data.forEach(i => {
          var temp = this.generatedMultiple.find(item => item.item == i.PO)
          i.QTY = temp.data.find(i => i.pn == this.scanedPN) ? temp.data.find(i => i.pn == this.scanedPN).qty : 0
          this.getSystemList(this.typeName, (systemInfo) => {
            var picklist = JSON.parse(systemInfo.find(item => item.Id == i.Id).PickList)
            picklist.forEach(item => {
              if (item.Component == this.scanedPN) {
                item.Remark = 1
              }
            })
            this.$http.post(config.baseUrl + 'systeminfo/updatePickList', {
              id: i.Id,
              str: JSON.stringify(picklist)
            }).then(res => {
              count++
              if (count == this.multiTable.data.length) {
                this.$Message.success({
                  content: this.scanedPN + '分配成功',
                  duration: 2
                })
                this.multiTable.data.splice(0, 0)
                this.pastPN = this.scanedPN;
                this.scanedPN = ''
                this.getSystemList(this.typeName)
              }
            })
          })
        })
      },

      // 点击完成分配
      finishAssign() {
        if(this.generatedMultiple.every(i => i.data.length == 0)) {
          var arr = []
          this.multiTable.data.forEach((e, i) => {
            arr[i] = e.Id
          })
          this.$http.post(config.baseUrl + 'systeminfo/finishAssign', { arr: arr }).then(res => {
            this.getSystemList(this.typeName)
            this.getRackList()
            this.goeasy.publish({
              channel: 'mc2te-finish',
              message: '批量分配已经完成'
              // message: '请注意，' + item.SystemSlot + ' ' + config.station.find(i => i.item == item.Station).chinese + '备料已经就绪，请及时取料！' + ' Attention please! ' + item.SystemSlot + ' ' + config.station.find(i => i.item == item.Station).english + ' material is ready! '
            });
          })
        } else {
          this.shortageModal = true
          this.$Message.error({
            content: '分配暂未完成，详情见表',
            duration: 2
          })
        }
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

      // 完成仓库备料通知
      finishTask(item) {
        this.$http.get(config.baseUrl + 'systeminfo/finishTask?id=' + item.Id).then(res => {
          if (res.body.Code == 200) {
            var obj = JSON.parse(item.PickList)
            obj.forEach(i => {
              i['MC Check'] = 1
            })
            this.$http.post(config.baseUrl + 'systeminfo/updatePickList', {
              id: item.Id,
              str: JSON.stringify(obj)
            }).then(res => {
              if (res.body.Code == 200) {
                this.getSystemList(this.typeName)
                this.$Message.success({
                  content: '仓库备料成功！',
                  duration: 2
                })
              }
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
            content: '仓库备料缺料！',
            duration: 2
          })
        } else {
          this.$http.get(config.baseUrl + 'systeminfo/finishTask?id=' + this.checkId).then(res => {
          if (res.body.Code == 200) {
            this.getSystemList(this.typeName)
            this.$Message.success({
              content: '仓库备料成功！',
              duration: 2
            })
          }
        })
        }
      },

      // 表格的选中事件
      multiselect(selection) {
        this.selectCheck = selection
      },
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
