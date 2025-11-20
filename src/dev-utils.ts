
export function trace_r<T>(obj?: T): T {
    if (obj !== undefined) {
        console.debug('TRACE:', getCallerName(trace_r), ':', obj);
    } else {
        console.debug('TRACE:', getCallerName(trace_r));
    }
    return obj as T;
}

// @ts-ignore 
export function getCallerName(ignoredFn?: Function): string {
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
        console.error("Could not retrieve caller method's name: ", msg);
        return unknown;
    }
}
