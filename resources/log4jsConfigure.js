export default {
  "appenders": {
    "logs": {
      "type": "console",
      "layout": {
        "type": "pattern",
        "pattern": "%[%d{yyyy/MM/dd-hh.mm.ss}%] --> %m"
      }
    },
    "McChatLogs": {
      "type": "file",
      "filename": "logs/logs.log",
      "layout": {
        "type": "pattern",
        "pattern": "%d{yyyy/MM/dd-hh.mm.ss} -> %m",
        "maxLogSize": 5000,
        "compress": true
      }
    },
    "Errors": {
      "type": "file",
      "filename": "logs/Errors.log",
      "layout": {
        "type": "pattern",
        "pattern": "%d{yyyy/MM/dd-hh.mm.ss} -> %m",
        "maxLogSize": 5000,
        "compress": true
      }
    },
    "Warn": {
      "type": "file",
      "filename": "logs/Warns.log",
      "layout": {
        "type": "pattern",
        "pattern": "%d{yyyy/MM/dd-hh.mm.ss} -> %m",
        "maxLogSize": 5000,
        "compress": true
      }
    },
    "Debug": {
      "type": "file",
      "filename": "logs/Debug.log",
      "layout": {
        "type": "pattern",
        "pattern": "%d{yyyy/MM/dd-hh.mm.ss} -> %m",
        "maxLogSize": 5000,
        "compress": true
      }
    }
  },
  "categories": {
    "default": {
      "appenders": ["logs"],
      "level": "info"
    },
    "McChatLogs": {
      "appenders": ["McChatLogs"],
      "level": "info"
    },
    "Errors": {
      "appenders": ["Errors"],
      "level": "error"
    },
    "Warn": {
      "appenders": ["Warn"],
      "level": "warn"
    },
    "Debug": {
      "appenders": ["Debug"],
      "level": "debug"
    }
  }
};
