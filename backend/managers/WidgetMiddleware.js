var dbManager = require('./DbManager');
var logger = require('log4js').getLogger('widgetMiddleware');


/**
 * relies on 'loggedUser' middleware.
 * verifies the user on session is admin
 */
exports.adminUser = function( req, res, next){
    if ( !req.user.isAdmin ){
        res.send(401, {'message' : 'need to be admin'});
        return;
    }
    logger.info('user ' + req.user.email  + ' is admin');
    next();
};

exports.loggedUser = function ( req, res, next ){

    if ( !req.session ){
        res.send(401, {'message': 'need to login. no session'});
        return;
    }
    var userId = req.session.userId;
    if ( !userId ){
        res.send(401, {'message':'need to login'});
        return;
    }


    dbManager.connect('users', function(db, collection, done){
        collection.findOne({_id: dbManager.toObjectId(userId)}, function(err, result){
            if ( !!err ){
                logger.info('unable to verify if user is logged in : ' + err.message );
                res.send(401, {'message' : 'unable to verify session : '  + err.message });
                done();
                return;
            }
            if ( !!result ){
                logger.trace('user is logged in : '  + result.email );
                req.user = result;
                done();
                next();
                return;
            }

            // default behavior if user was not found and we didn't get an error from DB.
            // lets delete the cookie and redirect to login

            req.session = null;
            res.send(401, {'message': 'need to relogin'});


        })
    })
};