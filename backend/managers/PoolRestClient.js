var logger = require('log4js').getLogger('PoolRestClient');
var conf = require('../Conf');
var _ = require('lodash');

// var ajax = require('http');
var Client = require('node-rest-client').Client;
var client = new Client;

function _getBaseUrl() {
    return conf.poolRestUrl.protocol + "://" + conf.poolRestUrl.domain + ":" + conf.poolRestUrl.port;
}

function _url(relativePath) {
    var result = _getBaseUrl() + relativePath;
    logger.debug('calling [%s]', result);
    return result;
}

function responseError(response, data) {
    var err = new Error();
    err.response = response;
    if (typeof(data) === 'string') {
        try {
            data = JSON.parse(data);
        } catch (e) {
        }
    }
    err.data = data;
    return err;
}

function Call() {

    function _callbackWrapper(callback) {
        return function (data, response) {
            if (response.statusCode == 200) {
                callback(null, data);
            } else {
                logger.info('got an error from rest client', response.statusCode);
                callback(responseError(response, data));
            }
        }
    }

    this.invoke = function (method, url, args, callback) {
        var myArgs = args;
        if (args instanceof ArgsBuilder) {
            myArgs = args.done();
        }
        logger.info('POST: ', url);
        var myUrl = _url(url);
        var myCallback = _callbackWrapper(callback);
        try {
            if (method == 'get') {
                var req = client.get(myUrl, myArgs, myCallback);
            } else if (method == 'post') {
                var req = client.post(myUrl, myArgs, myCallback);
            }
            req.on('error', function () {
                logger.error('got request error', arguments);
            })
        } catch (e) {
            logger.error('got error from client', e);
            callback(e);
        }
    };

    this.post = function (url, args, callback) {
        this.invoke('post', url, args, callback);
    };

    this.get = function (url, args, callback) {
        this.invoke('get', url, args, callback);
    };

}

var call = new Call();

function ArgsBuilder() {

    var _args = {  };

    this.header = function (_header) {
        _.merge(_args, {"headers": _header });
        return this;
    };

    this.path = function (_path) {
        _.merge(_args, {"path": _path});
        return this;
    };

    this.data = function (_data) {
        _.merge(_args, {"data": _data});
        return this;
    };

    this.param = function (_param) {
        _.merge(_args, {"parameters": _param});
    };

    this.done = function () {
        return _args;
    };


    this.poolKey = function (_poolKey) {
        this.header({"AccountUuid": _poolKey });
        return this;
    };

    this.accountId = function (_accountId) {
        this.path({"accountId": _accountId});
        return this;
    };

    this.poolId = function (_poolId) {
        this.path({"poolId": _poolId });
        return this;
    };

    this.nodeId = function (_nodeId) {
        this.path({"nodeId": _nodeId});
        return this;
    };

    this.taskId = function (_taskId) {
        this.path({"taskId": _taskId});
        return this;
    };

    this.widgetId = function (_widgetId) {
        this.path({"widgetId": _widgetId});
        return this;
    };

    this.cloudId = function (_cloudId) {
        this.path({"cloudId": _cloudId});
        return this;
    };
}


var _args = function () {
    return new ArgsBuilder();
};


/**************** ADMIN LEVEL CALLS ***************************/


exports.createAccount = function (poolKey, callback) {
    logger.info('creating account');
    call.post('/admin/accounts', _args().poolKey(poolKey), callback);
};

exports.readAccounts = function (poolKey, callback) {
    logger.info('get accounts called on pool rest client');
    call.get('/admin/accounts', _args().poolKey(poolKey), callback);
};

exports.adminReadPools = function (poolKey, callback) {
    logger.info('reading all pools');
    call.get('/admin/pools', _args().poolKey(poolKey), callback);
};

exports.adminReadAccountPools = function (poolKey, accountId, callback) {
    logger.info('getting all pools for account : ' + accountId);
    call.get('/admin/accounts/${accountId}/pools', _args().poolKey(poolKey).accountId(accountId), callback);
};

exports.createAccountPools = function (poolKey, accountId, poolSettings, callback) {
    logger.info('creating new pool for account ::' + accountId);
    call.post('/admin/accounts/${accountId}/pools', _args().poolKey(poolKey).accountId(accountId).data(poolSettings), callback);
};

exports.updateAccountPools = function (poolKey, accountId, poolId, poolSettings, callback) {
    logger.info('updating account [%s] pool [%s] ', accountId, poolId);
    call.post('/admin/accounts/${accountId}/pools/${poolId}', _args().poolKey(poolKey).accountId(accountId).poolId(poolId).data(poolSettings), callback);
};

exports.deleteAccountPools = function (poolKey, accountId, poolId, callback) {
    logger.info('deleting account [%s] pool [%s]', accountId, poolId);
    call.post('/admin/accounts/${accountId}/pools/${poolId}/delete', _args().poolKey(poolKey).accountId(accountId).poolId(poolId), callback);
};

exports.readAccountPool = function (poolKey, accountId, poolId, callback) {
    logger.info('reading account [%s] pool [%s]', accountId, poolId);
    call.get('/admin/accounts/${accountId}/pools/${poolId}', _args().poolKey(poolKey).accountId(accountId).poolId(poolId), callback);
};

// detailed status
exports.readPoolStatus = function (poolKey, poolId, callback) {
    logger.info('reading detailed pool status [%s]', poolId);
    call.get('/admin/pools/${poolId}/status', _args().poolKey(poolKey).poolId(poolId), callback);
};
// general status
exports.readPoolsStatus = function (poolKey, callback) {
    logger.info('reading general pool status');
    call.get('/admin/pools/status', _args().poolKey(poolKey), callback);
};

exports.readPoolNodes = function (poolKey, poolId, callback) {
    logger.info('reading pool machines [%s]', poolId);
    call.get('/admin/pools/${poolId}/nodes', _args().poolKey(poolKey).poolId(poolId), callback);
};
exports.createPoolNode = function (poolKey, poolId, callback) {
    logger.info('adding machine to pool');
    call.post('/admin/pools/${poolId}/nodes', _args().poolKey(poolKey).poolId(poolId), callback);
};
exports.deletePoolNode = function (poolKey, poolId, nodeId, callback) {
    logger.info('deleting machine from pool');
    call.post('/admin/pools/${poolId}/nodes/${nodeId}/delete', _args().poolKey(poolKey).poolId(poolId).nodeId(nodeId), callback);
};
exports.bootstrapPoolNode = function (poolKey, poolId, nodeId, callback) {
    logger.info('bootstrapping machine');
    call.post('/admin/pools/${poolId}/nodes/${nodeId}/bootstrap', _args().poolKey(poolKey).poolId(poolId).nodeId(nodeId), callback);
};
exports.occupyPoolNode = function (poolKey, poolId, callback) {
    logger.info('occupying machine in pool');
    call.get('/account/pools/${poolId}/occupy', _args().poolKey(poolKey).poolId(poolId), callback);
};

exports.readPoolErrors = function (poolKey, poolId, callback) {
    logger.info('reading pool errors [%s]', poolId);
    call.get('/admin/pools/${poolId}/errors', _args().poolKey(poolKey).poolId(poolId), callback);
};
exports.readPoolTasks = function (poolKey, poolId, callback) {
    logger.info('reading pool tasks [%s]', poolId);
    call.get('/admin/pools/${poolId}/tasks', _args().poolKey(poolKey).poolId(poolId), callback);
};
exports.deletePoolTask = function (poolKey, poolId, taskId, callback) {
    logger.info('deleting pool task [%s] from pool [%s]', taskId, poolId);
    call.post('/admin/pools/${poolId}/tasks/${taskId}/delete', _args().poolKey(poolKey).poolId(poolId).taskId(taskId), callback);
};

exports.readCloudNodes = function (poolKey, poolId, callback) {
    logger.info('reading cloud nodes for pool [%s]', poolId);
    call.get('/admin/pools/${poolId}/cloud/nodes', _args().poolKey(poolKey).poolId(poolId), callback);
};


/**************** ACCOUNT LEVEL CALLS ***************************/

exports.accountReadPools = function (poolKey, callback) {
    logger.info('reading account pools');
    call.get('/account/pools', _args().poolKey(poolKey), callback);
};

exports.createPool = function (poolKey, poolSettings, callback) {
    logger.info('creating pool for account');
    call.post('/account/pools', _args().poolKey(poolKey), callback);
};

exports.updatePool = function (poolKey, poolId, poolSettings, callback) {
    logger.info('updating pool [%s] for account ', poolId);
    call.post('/account/pools/${poolId}', _args().poolKey(poolKey).poolId(poolId).data(poolSettings), callback);
};

exports.deletePool = function (poolKey, poolId, callback) {
    logger.info('deleting pool [%s] for account', poolId);
    call.post('/account/pools/${poolId}/delete', _args().poolKey(poolKey).poolId(poolId), callback);
};

exports.accountReadPoolStatus = function (poolKey, poolId, callback) {
    logger.info('get pool [%s] status for account ', poolId);
    call.get('/account/pools/${poolId}/status', _args().poolKey(poolKey).poolId(poolId), callback);
};

exports.accountReadPoolsStatus = function (poolKey, callback) {
    logger.info('reading all pools  general status');
    call.get('/account/pools/status', _args().poolKey(poolKey), callback);
};