// Define types for your device information
export type DeviceID = 'GATEWAY' | 'FIELD_SENSOR1' | 'FIELD_SENSOR2' | 'FIELD_SENSOR3' | 'FIELD_SENSOR4' | 'FIELD_SENSOR5' | 'FIELD_SENSOR6' | 'FIELD_SENSOR7' | 'FIELD_SENSOR8' |'FIELD_SENSOR9'| 'FIELD_CONTROLLER1';

export interface DeviceInfo {
  [key: string]: string;
}

export interface DeviceCoordinates {
  [key: string]: [number, number]; // Tuple for coordinates [longitude, latitude]
}

// Defining constants for device IDs and their corresponding image and name mappings
export const DEVICES: Record<DeviceID, string> = {
  GATEWAY: '647FDAFFFF01B013',
  // FIELD_SENSOR1: '24E124126C486101',
  FIELD_SENSOR2: '24E124126C486336',
  FIELD_SENSOR3: '24E124126C486225',
  FIELD_SENSOR4: '24E124126C486081',
  FIELD_SENSOR5: '24E124126C486305',
  FIELD_SENSOR6: '24E124126C486094',
  FIELD_SENSOR7: '24E124126C486532',
  // FIELD_SENSOR8: '18000296984',
  // FIELD_SENSOR9: '18000344418',
  FIELD_CONTROLLER1: '24E124460C484055'
};

// Function to map device EUI to a sequence number
export const mapEUIToSequenceNumber = (eui: string): number | undefined => {
  // Device EUI prefixes and their starting sequence numbers
  const prefixMap = {
    '24E124126C4': {start: 1, devices: []},
    '18000': {start: 1, devices: []},
    '24E124460C4': {start: 1, devices: []}
  };

  // Fill the device arrays based on their EUI prefix
  Object.entries(DEVICES).forEach(([key, value]) => {
    if (value.startsWith('24E124126C4')) {
      prefixMap['24E124126C4'].devices.push(value);
    } else if (value.startsWith('18000')) {
      prefixMap['18000'].devices.push(value);
    } else if (value.startsWith('24E124460C4')) {
      prefixMap['24E124460C4'].devices.push(value);
    }
  });

  // Find the EUI in the prefixMap and return its sequence number
  for (const prefix in prefixMap) {
    const index = prefixMap[prefix].devices.indexOf(eui);
    if (index !== -1) {
      return index + prefixMap[prefix].start; // Correct sequence within the prefix category
    }
  }

  return undefined; // EUI not found
};




// Mapping of device IDs to image filenames
export const deviceImageMapping: DeviceInfo = {
  [DEVICES.GATEWAY]: 'kona-gateway.png',
  // [DEVICES.FIELD_SENSOR1]: 'semi-industrial-lorawan-gatewayicon.png',
  [DEVICES.FIELD_SENSOR2]: 'semi-industrial-lorawan-gatewayicon.png',
  [DEVICES.FIELD_SENSOR3]: 'semi-industrial-lorawan-gatewayicon.png',
  [DEVICES.FIELD_SENSOR4]: 'semi-industrial-lorawan-gatewayicon.png',
  [DEVICES.FIELD_SENSOR5]: 'semi-industrial-lorawan-gatewayicon.png',
  [DEVICES.FIELD_SENSOR6]: 'semi-industrial-lorawan-gatewayicon.png',
  [DEVICES.FIELD_SENSOR7]: 'semi-industrial-lorawan-gatewayicon.png',
  // [DEVICES.FIELD_SENSOR8]: 'sensoterra_single_depth.png',
  // [DEVICES.FIELD_SENSOR9]: 'sensoterra_single_depth.png',
  [DEVICES.FIELD_CONTROLLER1]: 'field-controller.png'
};

// Mapping of device IDs to custom names
export const deviceHardcodedNames: DeviceInfo = {
  [DEVICES.GATEWAY]: 'KONA Macro IoT Gateway',
  // [DEVICES.FIELD_SENSOR1]: 'Milesight EM500-SMTC Soil Moisture Sensor',
  [DEVICES.FIELD_SENSOR2]: 'Milesight EM500-SMTC Soil Moisture Sensor',
  [DEVICES.FIELD_SENSOR3]: 'Milesight EM500-SMTC Soil Moisture Sensor',
  [DEVICES.FIELD_SENSOR4]: 'Milesight EM500-SMTC Soil Moisture Sensor',
  [DEVICES.FIELD_SENSOR5]: 'Milesight EM500-SMTC Soil Moisture Sensor',
  [DEVICES.FIELD_SENSOR6]: 'Milesight EM500-SMTC Soil Moisture Sensor',
  [DEVICES.FIELD_SENSOR7]: 'Milesight EM500-SMTC Soil Moisture Sensor',
  // [DEVICES.FIELD_SENSOR8]: 'Sensoterra Single Depth Soil Moisture Sensor',
  // [DEVICES.FIELD_SENSOR9]: 'Sensoterra Single Depth Soil Moisture Sensor',
  [DEVICES.FIELD_CONTROLLER1]: 'Milesight UC511 Solenoid Valve Controller ' 
};

// Constants for device coordinates
export const deviceCoordinates: DeviceCoordinates = {
  [DEVICES.GATEWAY]: [35.581514, 32.283649],
  // [DEVICES.FIELD_SENSOR1]: [35.57622, 32.28388],
  [DEVICES.FIELD_SENSOR2]: [35.57861, 32.28431],
  [DEVICES.FIELD_SENSOR3]: [35.57793, 32.28370],
  [DEVICES.FIELD_SENSOR4]: [35.58021, 32.28424],
  [DEVICES.FIELD_SENSOR5]: [35.57972, 32.28389],
  [DEVICES.FIELD_SENSOR6]: [35.58169, 32.28283],
  [DEVICES.FIELD_SENSOR7]: [35.57672, 32.28446],
  // [DEVICES.FIELD_SENSOR8]: [35.57935, 32.28423],
  // [DEVICES.FIELD_SENSOR9]: [35.58165, 32.28293],
  [DEVICES.FIELD_CONTROLLER1]: [35.58157, 32.28339]
};

// Define a type for device depth information
export interface DeviceDepth {
  [key: string]: number; // Map device ID to a depth value
}

// Separate mapping for device depths
export const deviceDepths: DeviceDepth = {
  [DEVICES.GATEWAY]: 0, // Gateway depth set to 0 or any other value as appropriate
  // [DEVICES.FIELD_SENSOR1]: -30, // Uncomment and adjust as needed
  [DEVICES.FIELD_SENSOR2]: -30,
  [DEVICES.FIELD_SENSOR3]: -30,
  [DEVICES.FIELD_SENSOR4]: -30,
  [DEVICES.FIELD_SENSOR5]: -30,
  [DEVICES.FIELD_SENSOR6]: -15,
  [DEVICES.FIELD_SENSOR7]: -30,
  // [DEVICES.FIELD_SENSOR8]: -30,
  // [DEVICES.FIELD_SENSOR9]: -15
};


