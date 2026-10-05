pragma ComponentBehavior: Bound

import QtQuick
import Quickshell.Bluetooth
import Quickshell.Io
import Quickshell.Services.UPower
import qs.Commons
import qs.Ui
import "DeviceModel.js" as DeviceModel

Panel {
  id: root
  moduleName: "dlv.device-batteries"
  ipcTarget: "dlv.device-batteries"
  manageIpc: false

  readonly property var upowerDevices: UPower.devices ? UPower.devices.values : []
  readonly property var bluetoothDevices: Bluetooth.devices ? Bluetooth.devices.values : []
  readonly property var upowerTypes: ({
    LinePower: UPowerDeviceType.LinePower,
    Mouse: UPowerDeviceType.Mouse,
    Keyboard: UPowerDeviceType.Keyboard,
    Phone: UPowerDeviceType.Phone,
    Tablet: UPowerDeviceType.Tablet,
    GamingInput: UPowerDeviceType.GamingInput,
    Headset: UPowerDeviceType.Headset,
    Headphones: UPowerDeviceType.Headphones
  })
  readonly property var upowerStates: ({
    Charging: UPowerDeviceState.Charging,
    Discharging: UPowerDeviceState.Discharging,
    Empty: UPowerDeviceState.Empty,
    FullyCharged: UPowerDeviceState.FullyCharged,
    PendingCharge: UPowerDeviceState.PendingCharge,
    PendingDischarge: UPowerDeviceState.PendingDischarge
  })
  readonly property var deviceRows: DeviceModel.devices(
    upowerDevices, bluetoothDevices, upowerTypes, upowerStates)
  readonly property bool hasDevices: deviceRows.length > 0
  readonly property string barText: hasDevices ? "󰂄 " + DeviceModel.summary(deviceRows) : ""
  readonly property string tooltip: {
    if (!hasDevices) return "No connected device batteries"
    var lines = ["Device batteries"]
    for (var i = 0; i < deviceRows.length; i++) {
      var row = deviceRows[i]
      lines.push(row.name + ": " + row.percentage + "% · " + row.state)
    }
    return lines.join("\n")
  }

  IpcHandler {
    target: "dlv.device-batteries"

    function open() { root.open() }
    function close() { root.close() }
    function show() { root.open() }
    function hide() { root.close() }
    function toggle() { root.toggle() }
  }

  onHasDevicesChanged: if (!hasDevices) root.close()

  visible: hasDevices
  implicitWidth: hasDevices ? button.implicitWidth : 0
  implicitHeight: hasDevices ? button.implicitHeight : 0

  BarIconButton {
    id: button
    anchors.fill: parent
    bar: root.bar
    text: root.barText
    slotSize: Style.bar.iconSlot * 2
    tooltipText: root.tooltip
    onPressed: function(mouseButton) {
      if (mouseButton === Qt.LeftButton) root.toggle()
    }
  }

  KeyboardPanel {
    id: panel
    anchorItem: button
    owner: root
    bar: root.bar
    open: root.opened && root.hasDevices
    focusTarget: keyCatcher
    contentWidth: panel.fittedContentWidth(Style.space(360))
    contentHeight: panel.fittedContentHeight(content.implicitHeight)

    PanelKeyCatcher {
      id: keyCatcher
      anchors.fill: parent
      onCloseRequested: root.close()

      Column {
        id: content
        width: parent.width
        spacing: Style.space(12)

        Item {
          width: parent.width
          implicitHeight: Math.max(title.implicitHeight, count.implicitHeight)

          Text {
            id: title
            anchors.left: parent.left
            anchors.verticalCenter: parent.verticalCenter
            text: "Device batteries"
            textFormat: Text.PlainText
            color: root.barForeground
            font.family: Style.font.family
            font.pixelSize: Style.font.title
            font.bold: true
          }

          Text {
            id: count
            anchors.right: parent.right
            anchors.verticalCenter: parent.verticalCenter
            text: root.deviceRows.length === 1 ? "1 device" : root.deviceRows.length + " devices"
            textFormat: Text.PlainText
            color: root.barForeground
            opacity: 0.65
            font.family: Style.font.family
            font.pixelSize: Style.font.bodySmall
          }
        }

        Repeater {
          model: root.deviceRows

          delegate: Item {
            id: deviceRow
            required property var modelData
            required property int index

            width: content.width
            implicitHeight: rowContent.implicitHeight

            Column {
              id: rowContent
              width: parent.width
              spacing: Style.space(5)

              Item {
                width: parent.width
                implicitHeight: Math.max(icon.implicitHeight, details.implicitHeight, level.implicitHeight)

                Text {
                  id: icon
                  anchors.left: parent.left
                  anchors.verticalCenter: parent.verticalCenter
                  text: deviceRow.modelData.icon
                  textFormat: Text.PlainText
                  color: root.barForeground
                  font.family: Style.font.family
                  font.pixelSize: Style.font.heading
                }

                Column {
                  id: details
                  anchors.left: icon.right
                  anchors.leftMargin: Style.space(10)
                  anchors.right: level.left
                  anchors.rightMargin: Style.space(10)
                  anchors.verticalCenter: parent.verticalCenter
                  spacing: Style.space(1)

                  Text {
                    width: parent.width
                    text: deviceRow.modelData.name
                    textFormat: Text.PlainText
                    color: root.barForeground
                    font.family: Style.font.family
                    font.pixelSize: Style.font.body
                    elide: Text.ElideRight
                  }

                  Text {
                    width: parent.width
                    text: deviceRow.modelData.state
                    textFormat: Text.PlainText
                    color: root.barForeground
                    opacity: 0.62
                    font.family: Style.font.family
                    font.pixelSize: Style.font.caption
                    elide: Text.ElideRight
                  }
                }

                Text {
                  id: level
                  anchors.right: parent.right
                  anchors.verticalCenter: parent.verticalCenter
                  text: deviceRow.modelData.percentage + "%" + (deviceRow.modelData.charging ? " 󰚥" : "")
                  textFormat: Text.PlainText
                  color: root.barForeground
                  font.family: Style.font.family
                  font.pixelSize: Style.font.heading
                  font.bold: true
                }
              }

              Rectangle {
                width: parent.width
                height: Style.space(5)
                radius: height / 2
                color: Qt.rgba(root.barForeground.r, root.barForeground.g, root.barForeground.b, 0.12)

                Rectangle {
                  width: Math.max(parent.height, parent.width * deviceRow.modelData.percentage / 100)
                  height: parent.height
                  radius: parent.radius
                  color: root.barForeground
                }
              }
            }
          }
        }

      }
    }
  }
}
