const config = {
  baseUrl: 'http://10.194.51.14:3001/MaterialKitting/api/', // 服务器的接口地址
  // baseUrl: 'http://localhost:51570/api/', // 本地调试的地址

  // 站别对应的中文名和英文名
  station: [{
      item: 'TE',
      chinese: '测试',
      english: 'Test'
    },
    {
      item: 'Assy',
      chinese: '组装',
      english: 'Option Intergration'
    },
    {
      item: 'Button Up',
      chinese: 'button up',
      english: 'button up'
    },
    {
      item: 'FP',
      chinese: 'FP',
      english: 'final'
    }
  ]
}

const helper = {
  // 获取该日期是今年的哪一周
  getWeekOfYear: function (date) {
    var today = date;
    var firstDay = new Date(today.getFullYear(), 0, 1);
    var dayOfWeek = firstDay.getDay();
    var spendDay = 1;
    if (dayOfWeek != 0) {
      spendDay = 7 - dayOfWeek + 1;
    }
    firstDay = new Date(today.getFullYear(), 0, 1 + spendDay);
    var d = Math.ceil((today.valueOf() - firstDay.valueOf()) / 86400000);
    var result = Math.ceil(d / 7);
    return result + 1;
  },

  getFormatDate(date) {
    var arr = date.replace('T', '/').split(/[- : \/]/)
    var dt = new Date(arr[0], arr[1] - 1, arr[2], arr[3], arr[4], arr[5]);
    var week = this.getWeekOfYear(dt).toString().length > 1 ? this.getWeekOfYear(dt) : '0' + this.getWeekOfYear(dt)
    var day = dt.getDay() == 0 ? 7 : dt.getDay()
    return 'WK' + week + '.' + day + ' ' + date.substring(11)
  },

  customButton(params, h, station, that) {
    var item = params.row.mt.find(i => i.station == station)
    if (item) {
      if (item.ensureDate) {
        return h('div', [
          h('Poptip', {
            props: {
              trigger: 'hover',
              title: params.row.SystemSlot
            },
          }, [
            h('div', {
              slot: 'content',
              style: {
                textAlign: 'left'
              }
            }, [
              h('p', 'Station: ' + station),
              h('p', 'Remark: ' + (item.remark || 'N/A')),
              h('p', '通知时间: ' + (item.informDate ? item.informDate.replace('T', ' ') : 'N/A')),
              h('p', '要料时间: ' + (item.demandDate ? item.demandDate.replace('T', ' ') : 'N/A')),
              h('p', '开始时间: ' + (item.startDate ? item.startDate.replace('T', ' ') : 'N/A')),
              h('p', '结束时间: ' + (item.finishDate ? item.finishDate.replace('T', ' ') : 'N/A')),
              h('p', '确认时间: ' + (item.ensureDate ? item.ensureDate.replace('T', ' ') : 'N/A'))
            ]),
            h('Button', {
              props: {
                type: 'success',
                size: 'small'
              },
              style: {
                marginRight: '5px'
              }
            }, '备料完成')
          ])
        ])
      } else if (item.assignDate) {
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
                that.ensureId = (params.row.mt.find(i => i.station == station)).id
                that.checkList.data = JSON.parse((params.row.mt.find(i => i.station == station)).pickList)
                that.nameModal = true                
              }
            }
          }, '待确认收料')
        ])
      } else if (item.startDate) {
        return h('div', [
          h('Button', {
            props: {
              type: 'warning',
              size: 'small'
            },
            style: {
              marginRight: '5px'
            }
          }, '备料中...')
        ])
      }
      return h('div', [
        h('Dropdown', {
          props: {
            trigger: 'click'
          },
          on: {
            'on-click': (name) => {
              if (name == 'cxbl') {
                that.deleteId = (params.row.mt.find(i => i.station == station)).id
                that.deleteShow = true
              }
              if (name == 'xgbl') {
                that.editId = (params.row.mt.find(i => i.station == station)).id
                that.$http.get(config.baseUrl + 'systeminfo/getSystemById?id=' + that.editId).then(res => {
                  var o = res.body.Data[0]
                  that.formValidate.RequireDate = new Date(that.$moment(o.DemandDate))
                  that.formValidate.Station = o.Station;
                  that.formValidate.SystemSlot = o.SystemSlot;
                  that.formValidate.PO = o.PO;
                  that.formValidate.Remark = o.Remark;
                  that.editShow = true;
                  that.isEdit = true
                })
              }
            }
          }
        }, [
          h('Button', {
            props: {
              size: 'small'
            },
            style: {
              marginRight: '5px'
            }
          }, [
            h('span', '备料变更'),
            h('Icon', {
              props: {
                type: 'ios-arrow-down'
              }
            })
          ]),
          h('DropdownMenu', {
            slot: 'list'
          }, [
            h('DropdownItem', {
              props: {
                name: 'cxbl'
              }
            }, '撤销备料'),
            h('DropdownItem', {
              props: {
                name: 'xgbl',
                divided: true
              }
            }, '修改备料')
          ])
        ])
      ])
    } else if (params.row.mt.length == 0) {
      switch (station) {
        case 'Assy':
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
                  if (params.row.PO) {
                    that.isEdit = false;
                    that.editShow = true;
                    that.formValidate.RequireDate = new Date();
                    that.formValidate.Station = station;
                    that.formValidate.SystemSlot = params.row.SystemSlot;
                    that.formValidate.PO = params.row.PO;
                    that.formValidate.Remark = '';
                  } else {
                    that.$Message.error({
                      content: '暂无PO, 无法备料',
                      duration: 2
                    })
                  }
                }
              }
            }, '通知备料')
          ])

        default:
          return h('div', [
            h('Button', {
              props: {
                type: 'primary',
                size: 'small',
                disabled: true
              },
              style: {
                marginRight: '5px'
              },
              on: {
                click: () => {
                  if (params.row.PO) {
                    that.isEdit = false;
                    that.editShow = true;
                    that.formValidate.RequireDate = new Date();
                    that.formValidate.Station = station;
                    that.formValidate.SystemSlot = params.row.SystemSlot;
                    that.formValidate.PO = params.row.PO;
                    that.formValidate.Remark = '';
                  } else {
                    that.$Message.error({
                      content: '暂无PO, 无法备料',
                      duration: 2
                    })
                  }
                }
              }
            }, '通知备料')
          ])
      }
    } else if (params.row.mt.length == 1) {
      if (params.row.mt.find(i => i.station == 'Assy').informDate) {
        switch (station) {
          case 'TE':
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
                    if (params.row.PO) {
                      that.isEdit = false;
                      that.editShow = true;
                      that.formValidate.RequireDate = new Date();
                      that.formValidate.Station = station;
                      that.formValidate.SystemSlot = params.row.SystemSlot;
                      that.formValidate.PO = params.row.PO;
                      that.formValidate.Remark = '';
                    } else {
                      that.$Message.error({
                        content: '暂无PO, 无法备料',
                        duration: 2
                      })
                    }
                  }
                }
              }, '通知备料')
            ])

          default:
            return h('div', [
              h('Button', {
                props: {
                  type: 'primary',
                  size: 'small',
                  disabled: true
                },
                style: {
                  marginRight: '5px'
                },
                on: {
                  click: () => {
                    if (params.row.PO) {
                      that.isEdit = false;
                      that.editShow = true;
                      that.formValidate.RequireDate = new Date();
                      that.formValidate.Station = station;
                      that.formValidate.SystemSlot = params.row.SystemSlot;
                      that.formValidate.PO = params.row.PO;
                      that.formValidate.Remark = '';
                    } else {
                      that.$Message.error({
                        content: '暂无PO, 无法备料',
                        duration: 2
                      })
                    }
                  }
                }
              }, '通知备料')
            ])
        }
      } else {
        return h('div', [
          h('Button', {
            props: {
              type: 'primary',
              size: 'small',
              disabled: true
            },
            style: {
              marginRight: '5px'
            },
            on: {
              click: () => {
                if (params.row.PO) {
                  that.isEdit = false;
                  that.editShow = true;
                  that.formValidate.RequireDate = new Date();
                  that.formValidate.Station = station;
                  that.formValidate.SystemSlot = params.row.SystemSlot;
                  that.formValidate.PO = params.row.PO;
                  that.formValidate.Remark = '';
                } else {
                  that.$Message.error({
                    content: '暂无PO, 无法备料',
                    duration: 2
                  })
                }
              }
            }
          }, '通知备料')
        ])
      }
    } else if (params.row.mt.length == 2) {
      if (params.row.mt.find(i => i.station == 'TE').informDate) {
        switch (station) {
          case 'Button Up':
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
                    if (params.row.PO) {
                      that.isEdit = false;
                      that.editShow = true;
                      that.formValidate.RequireDate = new Date();
                      that.formValidate.Station = station;
                      that.formValidate.SystemSlot = params.row.SystemSlot;
                      that.formValidate.PO = params.row.PO;
                      that.formValidate.Remark = '';
                    } else {
                      that.$Message.error({
                        content: '暂无PO, 无法备料',
                        duration: 2
                      })
                    }
                  }
                }
              }, '通知备料')
            ])

          default:
            return h('div', [
              h('Button', {
                props: {
                  type: 'primary',
                  size: 'small',
                  disabled: true
                },
                style: {
                  marginRight: '5px'
                },
                on: {
                  click: () => {
                    if (params.row.PO) {
                      that.isEdit = false;
                      that.editShow = true;
                      that.formValidate.RequireDate = new Date();
                      that.formValidate.Station = station;
                      that.formValidate.SystemSlot = params.row.SystemSlot;
                      that.formValidate.PO = params.row.PO;
                      that.formValidate.Remark = '';
                    } else {
                      that.$Message.error({
                        content: '暂无PO, 无法备料',
                        duration: 2
                      })
                    }
                  }
                }
              }, '通知备料')
            ])
        }
      } else {
        return h('div', [
          h('Button', {
            props: {
              type: 'primary',
              size: 'small',
              disabled: true
            },
            style: {
              marginRight: '5px'
            },
            on: {
              click: () => {
                if (params.row.PO) {
                  that.isEdit = false;
                  that.editShow = true;
                  that.formValidate.RequireDate = new Date();
                  that.formValidate.Station = station;
                  that.formValidate.SystemSlot = params.row.SystemSlot;
                  that.formValidate.PO = params.row.PO;
                  that.formValidate.Remark = '';
                } else {
                  that.$Message.error({
                    content: '暂无PO, 无法备料',
                    duration: 2
                  })
                }
              }
            }
          }, '通知备料')
        ])
      }
    } else if (params.row.mt.length == 3) {
      if (params.row.mt.find(i => i.station == 'Button Up').informDate) {
        switch (station) {
          case 'FP':
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
                    if (params.row.PO) {
                      that.isEdit = false;
                      that.editShow = true;
                      that.formValidate.RequireDate = new Date();
                      that.formValidate.Station = station;
                      that.formValidate.SystemSlot = params.row.SystemSlot;
                      that.formValidate.PO = params.row.PO;
                      that.formValidate.Remark = '';
                    } else {
                      that.$Message.error({
                        content: '暂无PO, 无法备料',
                        duration: 2
                      })
                    }
                  }
                }
              }, '通知备料')
            ])

          default:
            return h('div', [
              h('Button', {
                props: {
                  type: 'primary',
                  size: 'small',
                  disabled: true
                },
                style: {
                  marginRight: '5px'
                },
                on: {
                  click: () => {
                    if (params.row.PO) {
                      that.isEdit = false;
                      that.editShow = true;
                      that.formValidate.RequireDate = new Date();
                      that.formValidate.Station = station;
                      that.formValidate.SystemSlot = params.row.SystemSlot;
                      that.formValidate.PO = params.row.PO;
                      that.formValidate.Remark = '';
                    } else {
                      that.$Message.error({
                        content: '暂无PO, 无法备料',
                        duration: 2
                      })
                    }
                  }
                }
              }, '通知备料')
            ])
        }
      } else {
        return h('div', [
          h('Button', {
            props: {
              type: 'primary',
              size: 'small',
              disabled: true
            },
            style: {
              marginRight: '5px'
            },
            on: {
              click: () => {
                if (params.row.PO) {
                  that.isEdit = false;
                  that.editShow = true;
                  that.formValidate.RequireDate = new Date();
                  that.formValidate.Station = station;
                  that.formValidate.SystemSlot = params.row.SystemSlot;
                  that.formValidate.PO = params.row.PO;
                  that.formValidate.Remark = '';
                } else {
                  that.$Message.error({
                    content: '暂无PO, 无法备料',
                    duration: 2
                  })
                }
              }
            }
          }, '通知备料')
        ])
      }
    }
  }
}

export {
  config,
  helper
}
