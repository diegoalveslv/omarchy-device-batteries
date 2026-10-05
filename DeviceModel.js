function toArray(values) {
  if (!values) return []
  if (Array.isArray(values)) return values.slice()

  var length = Number(values.length || 0)
  if (!isFinite(length) || length <= 0) return []

  var result = []
  for (var i = 0; i < length; i++) result.push(values[i])
  return result
}

function percentage(value) {
  var fraction = Number(value)
  if (!isFinite(fraction) || fraction < 0 || fraction > 1) return -1
  return Math.round(fraction * 100)
}

function normalizedName(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ")
}

function deviceName(device, fallback) {
  if (!device) return fallback || "External device"

  var name = String(device.model || device.deviceName || device.name || "").trim()
  return name || fallback || "External device"
}

function isUsableUPowerDevice(device, types) {
  if (!device || !device.ready || !device.isPresent) return false
  if (device.isLaptopBattery || device.powerSupply) return false
  if (types && device.type === types.LinePower) return false
  return percentage(device.percentage) >= 0
}

function stateLabel(state, states) {
  if (states && state === states.Charging) return "Charging"
  if (states && state === states.Discharging) return "Discharging"
  if (states && state === states.FullyCharged) return "Fully charged"
  if (states && state === states.PendingCharge) return "Waiting to charge"
  if (states && state === states.PendingDischarge) return "Waiting to discharge"
  if (states && state === states.Empty) return "Empty"
  return "Connected"
}

function isCharging(state, states) {
  return !!(states && (state === states.Charging || state === states.PendingCharge))
}

function upowerIcon(type, types) {
  if (types && type === types.Mouse) return "󰍽"
  if (types && type === types.Keyboard) return "󰌌"
  if (types && type === types.Headset) return "󰋋"
  if (types && type === types.Headphones) return "󰋋"
  if (types && type === types.Phone) return "󰏲"
  if (types && type === types.Tablet) return "󰓷"
  if (types && type === types.GamingInput) return "󰊗"
  return "󰂄"
}

function upowerRows(values, types, states) {
  var devices = toArray(values)
  var rows = []

  for (var i = 0; i < devices.length; i++) {
    var device = devices[i]
    if (!isUsableUPowerDevice(device, types)) continue

    var name = deviceName(device)
    rows.push({
      id: "upower:" + String(device.nativePath || name || i),
      identity: normalizedName(name),
      name: name,
      percentage: percentage(device.percentage),
      charging: isCharging(device.state, states),
      state: stateLabel(device.state, states),
      icon: upowerIcon(device.type, types),
      source: "UPower"
    })
  }

  return rows
}

function bluetoothRows(values, existingRows) {
  var devices = toArray(values)
  var rows = []
  var known = {}
  var existing = toArray(existingRows)

  for (var i = 0; i < existing.length; i++) known[existing[i].identity] = true

  for (var j = 0; j < devices.length; j++) {
    var device = devices[j]
    if (!device || !device.connected || !device.batteryAvailable) continue

    var level = percentage(device.battery)
    if (level < 0) continue

    var name = deviceName(device)
    var identity = normalizedName(name)
    if (identity && known[identity]) continue
    if (identity) known[identity] = true

    rows.push({
      id: "bluetooth:" + String(device.address || name || j),
      identity: identity,
      name: name,
      percentage: level,
      charging: false,
      state: "Connected",
      icon: "󰂱",
      source: "Bluetooth"
    })
  }

  return rows
}

function compareRows(left, right) {
  return String(left.name).localeCompare(String(right.name))
}

function devices(upowerDevices, bluetoothDevices, types, states) {
  var primary = upowerRows(upowerDevices, types, states)
  var fallback = bluetoothRows(bluetoothDevices, primary)
  return primary.concat(fallback).sort(compareRows)
}

function lowestPercentage(rows) {
  var values = toArray(rows)
  if (values.length === 0) return -1

  var lowest = 100
  for (var i = 0; i < values.length; i++) lowest = Math.min(lowest, Number(values[i].percentage))
  return lowest
}

function anyCharging(rows) {
  var values = toArray(rows)
  for (var i = 0; i < values.length; i++) if (values[i].charging) return true
  return false
}

function summary(rows) {
  var values = toArray(rows)
  var lowest = lowestPercentage(values)
  if (lowest < 0) return ""

  var prefix = values.length > 1 ? String(values.length) + " · " : ""
  return prefix + String(lowest) + "%" + (anyCharging(values) ? " 󰚥" : "")
}

if (typeof module !== "undefined") {
  module.exports = {
    toArray: toArray,
    percentage: percentage,
    normalizedName: normalizedName,
    deviceName: deviceName,
    isUsableUPowerDevice: isUsableUPowerDevice,
    stateLabel: stateLabel,
    isCharging: isCharging,
    upowerIcon: upowerIcon,
    upowerRows: upowerRows,
    bluetoothRows: bluetoothRows,
    devices: devices,
    lowestPercentage: lowestPercentage,
    anyCharging: anyCharging,
    summary: summary
  }
}
