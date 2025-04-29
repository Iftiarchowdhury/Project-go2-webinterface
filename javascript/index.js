import { Go2WebRTC } from "./go2webrtc.js";

// Function to log messages to the console and the log window
function logMessage(text) {
  var log = document.querySelector("#log");
  var msg = document.getElementById("log-code");
  msg.textContent += truncateString(text, 300) + "\n";
  log.scrollTop = log.scrollHeight;
}
globalThis.logMessage = logMessage;

// Function to load saved values from localStorage
function loadSavedValues() {
  const savedToken = localStorage.getItem("token");
  const savedRobotIP = localStorage.getItem("robotIP");

  if (savedToken) {
    document.getElementById("token").value = savedToken;
  }
  if (savedRobotIP) {
    document.getElementById("robot-ip").value = savedRobotIP;
  }

  const commandSelect = document.getElementById("command");
  Object.entries(SPORT_CMD).forEach(([value, text]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = text;
    commandSelect.appendChild(option);
  });
}

// Function to save values to localStorage
function saveValuesToLocalStorage() {
  const token = document.getElementById("token").value;
  const robotIP = document.getElementById("robot-ip").value;

  localStorage.setItem("token", token);
  localStorage.setItem("robotIP", robotIP);
}


// Function to handle robot messages and update the status board
function handleRobotMessage(data) {
  // Check if this is a response to our GetState request
  if (data.type === "msg" && 
     (data.topic === "rt/sportmodestate" || data.topic === "rt/lf/sportmodestate")) {
    try {
      console.log("Received robot status:", data);
      
      if (data.data) {
        // Show the status board
        document.getElementById('status-board').style.display = 'block';
        
        // Update timestamp
        if (data.data.stamp) {
          const date = new Date(data.data.stamp.sec * 1000);
          document.getElementById('status-timestamp').textContent = date.toLocaleString();
        }
        
        // Update error code
        document.getElementById('status-error-code').textContent = data.data.error_code;
        if (data.data.error_code > 0) {
          document.getElementById('status-error-code').classList.add('danger');
        } else {
          document.getElementById('status-error-code').classList.remove('danger');
          document.getElementById('status-error-code').classList.add('success');
        }
        
        // Update IMU data
        if (data.data.imu_state) {
          // RPY (Roll, Pitch, Yaw) data
          if (data.data.imu_state.rpy) {
            document.getElementById('status-roll').textContent = data.data.imu_state.rpy[0].toFixed(4) + '°';
            document.getElementById('status-pitch').textContent = data.data.imu_state.rpy[1].toFixed(4) + '°';
            document.getElementById('status-yaw').textContent = data.data.imu_state.rpy[2].toFixed(4) + '°';
          }
          
          // Quaternion data
          if (data.data.imu_state.quaternion) {
            document.getElementById('status-quaternion').textContent = 
              '[' + data.data.imu_state.quaternion.map(v => v.toFixed(4)).join(', ') + ']';
          }
          
          // Gyroscope data
          if (data.data.imu_state.gyroscope) {
            document.getElementById('status-gyroscope').textContent = 
              '[' + data.data.imu_state.gyroscope.map(v => v.toFixed(4)).join(', ') + ']';
          }
          
          // Accelerometer data
          if (data.data.imu_state.accelerometer) {
            document.getElementById('status-accelerometer').textContent = 
              '[' + data.data.imu_state.accelerometer.map(v => v.toFixed(4)).join(', ') + ']';
          }
          
          // IMU temperature
          if (data.data.imu_state.temperature) {
            const temp = data.data.imu_state.temperature;
            document.getElementById('status-imu-temp').textContent = temp + '°C';
            
            // Add color based on temperature
            if (temp > 85) {
              document.getElementById('status-imu-temp').classList.add('danger');
            } else if (temp > 75) {
              document.getElementById('status-imu-temp').classList.add('warning');
            }
          }
        }
        
        // Update robot state information
        document.getElementById('status-mode').textContent = data.data.mode;
        document.getElementById('status-progress').textContent = data.data.progress;
        document.getElementById('status-gait-type').textContent = data.data.gait_type;
        document.getElementById('status-body-height').textContent = data.data.body_height.toFixed(3) + 'm';
        document.getElementById('status-foot-raise-height').textContent = data.data.foot_raise_height.toFixed(3) + 'm';
        
        // Update position and velocity information
        if (data.data.position) {
          document.getElementById('status-position').textContent = 
            '[' + data.data.position.map(v => v.toFixed(4)).join(', ') + ']m';
        }
        
        if (data.data.velocity) {
          document.getElementById('status-velocity').textContent = 
            '[' + data.data.velocity.map(v => v.toFixed(4)).join(', ') + ']m/s';
        }
        
        document.getElementById('status-yaw-speed').textContent = data.data.yaw_speed.toFixed(4) + 'rad/s';
        
        // Update foot force information
        if (data.data.foot_force && data.data.foot_force.length === 4) {
          document.getElementById('status-foot-fr').textContent = data.data.foot_force[0] + 'N';
          document.getElementById('status-foot-fl').textContent = data.data.foot_force[1] + 'N';
          document.getElementById('status-foot-rr').textContent = data.data.foot_force[2] + 'N';
          document.getElementById('status-foot-rl').textContent = data.data.foot_force[3] + 'N';
        }
        
        // Update range obstacle information
        if (data.data.range_obstacle && data.data.range_obstacle.length === 4) {
          document.getElementById('status-range-front').textContent = data.data.range_obstacle[0] + 'm';
          document.getElementById('status-range-right').textContent = data.data.range_obstacle[1] + 'm';
          document.getElementById('status-range-rear').textContent = data.data.range_obstacle[2] + 'm';
          document.getElementById('status-range-left').textContent = data.data.range_obstacle[3] + 'm';
          
          // Add warning color for close obstacles (less than 0.5m)
          for (let i = 0; i < 4; i++) {
            const element = document.getElementById(`status-range-${['front', 'right', 'rear', 'left'][i]}`);
            if (data.data.range_obstacle[i] < 0.5) {
              element.classList.add('danger');
            } else if (data.data.range_obstacle[i] < 1.0) {
              element.classList.add('warning');
            } else {
              element.classList.remove('warning', 'danger');
            }
          }
        }
      }
    } catch (error) {
      console.error("Error processing robot status:", error);
    }
  }


    // Handle lidar data
    if (data.type === "msg" && data.topic === "rt/utlidar/voxel_map_compressed") {
      console.log("Received lidar data:", data);
      
      // Create a MediaSource for the lidar video
      if (!globalThis.lidarMediaSource) {
        globalThis.lidarMediaSource = new MediaSource();
        document.getElementById('lidar-frame').src = URL.createObjectURL(globalThis.lidarMediaSource);
        
        globalThis.lidarMediaSource.addEventListener('sourceopen', function() {
          console.log("Lidar MediaSource opened");
          globalThis.lidarSourceBuffer = globalThis.lidarMediaSource.addSourceBuffer('video/webm; codecs="vp8"');
        });
      }
      
      // If we have lidar data and the source buffer is ready, append the data
      if (data.data && data.data.data && globalThis.lidarSourceBuffer && !globalThis.lidarSourceBuffer.updating) {
        try {
          // Convert the lidar data to a video frame
          // This is a placeholder - you would need to implement the actual conversion
          // from lidar data to video frames
          const lidarBuffer = new Uint8Array(data.data.data);
          globalThis.lidarSourceBuffer.appendBuffer(lidarBuffer);
        } catch (e) {
          console.error("Error appending lidar data to buffer:", e);
        }
      }
    }

}


// Function to handle connect button click
function handleConnectClick() {
  // You can add connection logic here
  // For now, let's just log the values
  const token = document.getElementById("token").value;
  const robotIP = document.getElementById("robot-ip").value;

  console.log("Token:", token);
  console.log("Robot IP:", robotIP);
  logMessage(`Connecting to robot on ip ${robotIP}...`);

  // Save the values to localStorage
  saveValuesToLocalStorage();

  // Initialize RTC
  globalThis.rtc = new Go2WebRTC(token, robotIP, handleRobotMessage);
  globalThis.rtc.initSDP();
}

function handleExecuteClick() {
  const uniqID =
    (new Date().valueOf() % 2147483648) + Math.floor(Math.random() * 1e3);
  const command = parseInt(document.getElementById("command").value);

  console.log("Command:", command);

  globalThis.rtc.publish("rt/api/sport/request", {
    header: { identity: { id: uniqID, api_id: command } },
    parameter: JSON.stringify(command),
    // api_id: command,
  });
}


function handleExecuteCustomClick() {
    const command = document.getElementById("custom-command").value;
  
    console.log("Command:", command);
  
    globalThis.rtc.channel.send(command);
  }

function truncateString(str, maxLength) {
  if (typeof str !== "string") {
    str = JSON.stringify(str);
  }

  if (str.length > maxLength) {
    return str.substring(0, maxLength) + "...";
  } else {
    return str;
  }
}

function applyGamePadDeadzeone(value, th) {
  return Math.abs(value) > th ? value : 0
}

function joystickTick(joyLeft, joyRight) {
  let x,y,z = 0;
  let gpToUse = document.getElementById("gamepad").value;
  if (gpToUse !== "NO") {
    const gamepads = navigator.getGamepads();
    let gp = gamepads[gpToUse];
    
    // LB must be pressed
    if (gp.buttons[4].pressed == true) {
      x = -1 * applyGamePadDeadzeone(gp.axes[1], 0.25);
      y = -1 * applyGamePadDeadzeone(gp.axes[2], 0.25);
      z = -1 * applyGamePadDeadzeone(gp.axes[0], 0.25);
    } 
  } else {
     y = -1 * (joyRight.GetPosX() - 100) / 50;
     x = -1 * (joyLeft.GetPosY() - 100) / 50;
     z = -1 * (joyLeft.GetPosX() - 100) / 50;
  }

  if (x === 0 && y === 0 && z === 0) {
    return;
  }

  if (x == undefined || y == undefined || z == undefined) {
    return;
  }

  console.log("Joystick Linear:", x, y, z);

  if(globalThis.rtc == undefined) return;
  globalThis.rtc.publishApi("rt/api/sport/request", 1008, JSON.stringify({x: x, y: y, z: z}));
}

function addJoysticks() {
  const joyConfig = {
    internalFillColor: "#FFFFFF",
    internalLineWidth: 2,
    internalStrokeColor: "rgba(240, 240, 240, 0.3)",
    externalLineWidth: 1,
    externalStrokeColor: "#FFFFFF",
  };
  var joyLeft = new JoyStick("joy-left", joyConfig);
  var joyRight = new JoyStick("joy-right", joyConfig);

  //setInterval( joystickTick, 100, joyLeft, joyRight );
}

const buildGamePadsSelect = (e) => {
  const gp = navigator.getGamepads().filter(x => x != null && x.id.toLowerCase().indexOf("xbox") != -1);

  const gamepadSelect = document.getElementById("gamepad");
  gamepadSelect.innerHTML = "";

  const option = document.createElement("option");
  option.value = "NO";
  option.textContent = "Don't use Gamepad"
  option.selected = true;
  gamepadSelect.appendChild(option);  

  Object.entries(gp).forEach(([index, value]) => {
    if (!value) return
    const option = document.createElement("option");
    option.value = value.index;
    option.textContent = value.id;
    gamepadSelect.appendChild(option);
  });
};

window.addEventListener("gamepadconnected", buildGamePadsSelect);
window.addEventListener("gamepaddisconnected", buildGamePadsSelect);
buildGamePadsSelect();

// Load saved values when the page loads
document.addEventListener("DOMContentLoaded", loadSavedValues);
document.addEventListener("DOMContentLoaded", addJoysticks);

document.getElementById("gamepad").addEventListener("change", () => {
//alert("change");
});

// Attach event listener to connect button
document
  .getElementById("connect-btn")
  .addEventListener("click", handleConnectClick);

document
  .getElementById("execute-btn")
  .addEventListener("click", handleExecuteClick);

document
  .getElementById("execute-custom-btn")
  .addEventListener("click", handleExecuteCustomClick);




  document.addEventListener('keydown', function(event) {
    const key = event.key.toLowerCase();
    let x = 0, y = 0, z = 0;

    switch (key) {
        case 'w': // Forward
            x = 0.8;
            break;
        case 's': // Reverse
            x = -0.4;
            break;
        case 'a': // Sideways left
            y = 0.4;
            break;
        case 'd': // Sideways right
            y = -0.4;
            break;
        case 'q': // Turn left
            z = 2;
            break;
        case 'e': // Turn right
            z = -2;
            break;
        default:
            return; // Ignore other keys
    }

    if(globalThis.rtc !== undefined) {
        globalThis.rtc.publishApi("rt/api/sport/request", 1008, JSON.stringify({x: x, y: y, z: z}));
    }
});

document.addEventListener('keyup', function(event) {
    const key = event.key.toLowerCase();
    if (key === 'w' || key === 's' || key === 'a' || key === 'd' || key === 'q' || key === 'e') {
        if(globalThis.rtc !== undefined) {
            // Stop movement by sending zero velocity
            globalThis.rtc.publishApi("rt/api/sport/request", 1008, JSON.stringify({x: 0, y: 0, z: 0}));
        }
    }
});

