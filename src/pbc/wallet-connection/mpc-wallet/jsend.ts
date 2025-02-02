
var STATUSES = {
    success: { required: ['status', 'data'], allowed:['status', 'data'] },
    fail: { required: ['status', 'data'], allowed:['status', 'data'] },
    error: { required: ['status', 'message'], allowed:['status', 'message', 'data', 'code'] }
};

function requireKeys(keys: string[], json: object) {
    return keys.every(function(key) {
        return key in json;
    });
}

function allowKeys(keys: string[], json: object) {
    return Object.keys(json).every(function(key) {
        return ~keys.indexOf(key);
    });
}


function jsend_isValid(json: {status: keyof typeof STATUSES}) {
    const spec = STATUSES[json.status];

    return !!spec && requireKeys(spec.required, json) && allowKeys(spec.allowed, json);
}

export function jsendForward(json: any, done: (err: any, data: any) => void) {
    if(!jsend_isValid(json))
        json = {
            status: 'error',
            message: 'Invalid jsend object.',
            data: { originalObject: json }
        };

    if(json.status === 'success')
        done(null, json.data);
    else {
        let err: any = new Error(json.message || ('Jsend response status: ' + json.status));
        if('code' in json) err["code"] = json.code;
        if('data' in json) err["data"] = json.data;
        done(err, json.data);
    }
}