import { log as console_log, debug as console_debug } from 'console';

if (__filename.endsWith('ts')) {
    // Jest overwrites the console.* functions. Reset them to the original console module.
    // I don't want to see the name of this file after every debug line.
    console.log = console_log;
    console.debug = console_debug;
}

let logging_enabled = true; // log, info, debug

export function setLoggingEnabled(enabled: boolean = true) {
    logging_enabled = enabled;
}

export function debug(message?: any, ...optionalParams: any[]): void {
    if (logging_enabled) {
        console.debug(message, optionalParams);
    }
}

export function log(message?: any, ...optionalParams: any[]): void {
    if (logging_enabled) {
        console.log(message, optionalParams);
    }
}

export function trace_r<T>(obj?: T): T {
    if (logging_enabled) {
        const msg = (obj !== undefined) ? ': ' + obj : '';
        console.debug('TRACE:', getCallerName(trace_r), msg);
    }
    return obj as T;
}

export function getCallerName(ignoredFn?: Function | undefined): string {
    const unknown = '<unknown>';
    try {
        const obj: { stack: string } = { stack: '' };
        Error.captureStackTrace(obj, ignoredFn);
        const lines = obj.stack.split('\n');
        const callerLine = lines[1].trim(); // e.g. "at myfunc (/path/file.js:10:5)" or "at /path/file.js:10:5"
        const m = callerLine.match(/^at\s+(.*?)\s+\(/) || callerLine.match(/^at\s+(.*)$/);
        const name = m && m[1] || unknown;
        // cleanup, remove tokens like "new", "<anonymous>"
        return name.replace(/^new\s+/, '').replace(/<anonymous>/g, '').replace(/\s*\[.*?\]\s*$/, '');
    } catch (msg) {
        // Use _console_.error() here so that Jest logging shows where this error originated from (this file)
        console.error("Could not retrieve caller method's name: ", msg);
        return unknown;
    }
}
