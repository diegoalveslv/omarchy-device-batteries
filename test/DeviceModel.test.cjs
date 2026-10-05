const assert = require("node:assert/strict")
const test = require("node:test")
const model = require("../DeviceModel.js")

const types = {
  LinePower: 1,
  Mouse: 5,
  Keyboard: 6,
  Phone: 8,
  Tablet: 10,
  GamingInput: 12,
  Headset: 16,
  Headphones: 18
}

const states = {
  Charging: 1,
  Discharging: 2,
  Empty: 3,
  FullyCharged: 4,
  PendingCharge: 5,
  PendingDischarge: 6
}

test("keeps connected external UPower devices, including charging wired devices", () => {
  const rows = model.upowerRows([
    {
      ready: true,
      isPresent: true,
      isLaptopBattery: false,
      powerSupply: false,
      type: types.Mouse,
      model: "MX Master 3S",
      nativePath: "hidpp_battery_5",
      percentage: 0.75,
      state: states.Charging
    },
    {
      ready: true,
      isPresent: true,
      isLaptopBattery: true,
      powerSupply: true,
      type: 2,
      model: "Internal battery",
      percentage: 0.84,
      state: states.Discharging
    }
  ], types, states)

  assert.deepEqual(rows, [{
    id: "upower:hidpp_battery_5",
    identity: "mx master 3s",
    name: "MX Master 3S",
    percentage: 75,
    charging: true,
    state: "Charging",
    icon: "󰍽",
    source: "UPower"
  }])
})

test("uses Bluetooth battery data only when UPower has not already identified the device", () => {
  const upower = [{
    id: "upower:mouse",
    identity: "mx master 3s",
    name: "MX Master 3S",
    percentage: 75,
    charging: true,
    state: "Charging",
    icon: "󰍽",
    source: "UPower"
  }]

  const rows = model.bluetoothRows([
    {
      connected: true,
      batteryAvailable: true,
      battery: 0.75,
      deviceName: "MX Master 3S",
      address: "D1:7C:D3:7E:D6:E1"
    },
    {
      connected: true,
      batteryAvailable: true,
      battery: 0.5,
      deviceName: "Headphones",
      address: "00:11:22:33:44:55"
    }
  ], upower)

  assert.equal(rows.length, 1)
  assert.equal(rows[0].name, "Headphones")
  assert.equal(rows[0].percentage, 50)
  assert.equal(rows[0].source, "Bluetooth")
})

test("summarises the lowest charge level and charging state", () => {
  const rows = [
    { percentage: 75, charging: true },
    { percentage: 42, charging: false }
  ]

  assert.equal(model.lowestPercentage(rows), 42)
  assert.equal(model.summary(rows), "2 · 42% 󰚥")
})
