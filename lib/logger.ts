import { dateOptions } from "./consts";

class logger {
  static info = function (message?: any, ...optionalParams: any[]) {
    console.log(
      new Date(Date.now()).toUTCString(),
      "::",
      message,
      ...optionalParams
    );
  };
  static error = function (message?: any, ...optionalParams: any[]) {
    console.error(
      new Date(Date.now()).toUTCString(),
      "::",
      message,
      ...optionalParams
    );
  };
}

export default logger;
